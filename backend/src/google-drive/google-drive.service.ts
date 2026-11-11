import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import { extname } from 'path';
import { Readable } from 'stream';

const MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

const BATAS_UNDUH = 1024 * 1024 * 1024;

type IsiDrive = { path: string; data: Readable };

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private token: { value: string; exp: number } | null = null;
  private readonly folderCache = new Map<string, string>();

  isConfigured() {
    return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.exp > Date.now() + 60_000) return this.token.value;
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
        grant_type: 'refresh_token',
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      throw new Error(`Token Google gagal: ${data.error_description ?? data.error ?? res.status}`);
    }
    this.token = { value: data.access_token, exp: Date.now() + (Number(data.expires_in) || 3000) * 1000 };
    return this.token.value;
  }

  private async api(url: string, init: RequestInit = {}) {
    const res = await fetch(url, {
      ...init,
      headers: { ...(init.headers ?? {}), Authorization: `Bearer ${await this.accessToken()}` },
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Drive API ${res.status}: ${data?.error?.message ?? 'gagal'}`);
    return data;
  }

  idDariLink(url: string): { id: string; folder: boolean } | null {
    const folder = url.match(/\/folders\/([\w-]+)/);
    if (folder) return { id: folder[1], folder: true };
    const berkas = url.match(/\/d\/([\w-]+)/) ?? url.match(/[?&]id=([\w-]+)/);
    return berkas ? { id: berkas[1], folder: false } : null;
  }

  canDownload() {
    return this.isConfigured() || !!process.env.GOOGLE_API_KEY;
  }

  private async ambil(url: string): Promise<Response> {
    const key = process.env.GOOGLE_API_KEY;
    const sambung = (u: string) => `${u}${u.includes('?') ? '&' : '?'}supportsAllDrives=true`;
    let terakhir: Response | null = null;
    if (key) {
      terakhir = await fetch(`${sambung(url)}&key=${key}`);
      if (terakhir.ok) return terakhir;
    }
    if (this.isConfigured()) {
      const res = await fetch(sambung(url), { headers: { Authorization: `Bearer ${await this.accessToken()}` } });
      if (res.ok) return res;
      terakhir = res;
    }
    throw new Error(`Drive ${terakhir?.status ?? 'tidak dikonfigurasi'}`);
  }

  private async metaBerkas(id: string) {
    const res = await this.ambil(`https://www.googleapis.com/drive/v3/files/${id}?fields=id,name,mimeType`);
    return (await res.json()) as { id: string; name: string; mimeType: string };
  }

  private async isiFolder(id: string) {
    const hasil: { id: string; name: string; mimeType: string }[] = [];
    let halaman = '';
    do {
      const q = encodeURIComponent(`'${id}' in parents and trashed = false`);
      const res = await this.ambil(
        `https://www.googleapis.com/drive/v3/files?q=${q}&fields=nextPageToken,files(id,name,mimeType)&pageSize=200&includeItemsFromAllDrives=true${halaman ? `&pageToken=${halaman}` : ''}`,
      );
      const data: any = await res.json();
      hasil.push(...(data.files ?? []));
      halaman = data.nextPageToken ?? '';
    } while (halaman);
    return hasil;
  }

  private async unduhBerkas(f: { id: string; name: string; mimeType: string }) {
    const EKSPOR: Record<string, [string, string]> = {
      'application/vnd.google-apps.document': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
      'application/vnd.google-apps.spreadsheet': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx'],
      'application/vnd.google-apps.presentation': ['application/vnd.openxmlformats-officedocument.presentationml.presentation', '.pptx'],
    };
    if (f.mimeType.startsWith('application/vnd.google-apps.')) {
      const [mime, ext] = EKSPOR[f.mimeType] ?? ['application/pdf', '.pdf'];
      const res = await this.ambil(`https://www.googleapis.com/drive/v3/files/${f.id}/export?mimeType=${encodeURIComponent(mime)}`);
      return { nama: f.name.endsWith(ext) ? f.name : `${f.name}${ext}`, data: this.alirkan(res) };
    }
    const res = await this.ambil(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`);
    return { nama: f.name, data: this.alirkan(res) };
  }

  private namaDariHeader(res: Response, cadangan: string) {
    const cd = res.headers.get('content-disposition') ?? '';
    const utf = cd.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf) { try { return decodeURIComponent(utf[1]); } catch { return utf[1]; } }
    const biasa = cd.match(/filename="?([^";]+)"?/i);
    return biasa ? biasa[1] : cadangan;
  }

  private alirkan(res: Response) {
    const ukuran = Number(res.headers.get('content-length') ?? 0);
    if (ukuran > BATAS_UNDUH) {
      void res.body?.cancel();
      throw new Error(`berkas terlalu besar (${Math.round(ukuran / 1048576)} MB)`);
    }
    if (!res.body) throw new Error('berkas kosong');
    return Readable.fromWeb(res.body as any);
  }

  private decodeHtml(t: string) {
    return t.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  }

  private async isiFolderPublik(id: string) {
    const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${id}`);
    if (!res.ok) throw new Error(`Folder tidak bisa dibuka (${res.status})`);
    const html = await res.text();
    const hasil: { id: string; name: string; jenis: 'folder' | 'file' | 'doc' | 'sheet' | 'slide' }[] = [];
    const blok = html.split('class="flip-entry"').slice(1);
    for (const b of blok) {
      const href = b.match(/href="([^"]+)"/)?.[1] ?? '';
      const judul = b.match(/class="flip-entry-title"[^>]*>([^<]*)</)?.[1] ?? '';
      const m = href.match(/\/(folders|d)\/([\w-]+)/) ?? href.match(/[?&]id=([\w-]+)/);
      const fid = m ? m[m.length - 1] : b.match(/id="entry-([\w-]+)"/)?.[1];
      if (!fid) continue;
      const jenis = href.includes('/folders/') ? 'folder'
        : href.includes('/document/') ? 'doc'
        : href.includes('/spreadsheets/') ? 'sheet'
        : href.includes('/presentation/') ? 'slide' : 'file';
      hasil.push({ id: fid, name: this.decodeHtml(judul) || fid, jenis });
    }
    return hasil;
  }

  private async unduhPublik(id: string, jenis: string, nama: string) {
    const EKS: Record<string, [string, string]> = {
      doc: [`https://docs.google.com/document/d/${id}/export?format=docx`, '.docx'],
      sheet: [`https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`, '.xlsx'],
      slide: [`https://docs.google.com/presentation/d/${id}/export/pptx`, '.pptx'],
    };
    if (EKS[jenis]) {
      const [u, ext] = EKS[jenis];
      const res = await fetch(u);
      if (!res.ok) { void res.body?.cancel(); throw new Error(`Drive ${res.status}`); }
      return { nama: nama.endsWith(ext) ? nama : `${nama}${ext}`, data: this.alirkan(res) };
    }
    const res = await fetch(`https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`);
    const tipe = res.headers.get('content-type') ?? '';
    if (!res.ok || tipe.includes('text/html')) {
      void res.body?.cancel();
      throw new Error(`Drive ${res.ok ? 'meminta akses' : res.status}`);
    }
    return { nama: this.namaDariHeader(res, nama), data: this.alirkan(res) };
  }

  private async unduhDariLinkPublik(ref: { id: string; folder: boolean }, aksi: (e: IsiDrive) => Promise<void>, gagal: (pesan: string) => void) {
    const bersih = (s: string) => s.replace(/[\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'tanpa-nama';
    let jumlah = 0;
    const jalan = async (items: { id: string; name: string; jenis: string }[], dasar: string) => {
      for (const it of items) {
        if (it.jenis === 'folder') {
          await jalan(await this.isiFolderPublik(it.id), dasar ? `${dasar}/${bersih(it.name)}` : bersih(it.name));
          continue;
        }
        try {
          const b = await this.unduhPublik(it.id, it.jenis, it.name);
          await aksi({ path: `${dasar}${dasar ? '/' : ''}${bersih(b.nama)}`, data: b.data });
          jumlah++;
        } catch (e: any) {
          gagal(`${it.name}: ${e.message}`);
        }
      }
    };
    if (ref.folder) await jalan(await this.isiFolderPublik(ref.id), '');
    else await jalan([{ id: ref.id, name: 'berkas', jenis: 'file' }], '');
    return jumlah;
  }

  async unduhDariLink(url: string, aksi: (e: IsiDrive) => Promise<void>, gagal: (pesan: string) => void) {
    const ref = this.idDariLink(url);
    if (!ref) throw new Error('Link Drive tidak dikenali');
    if (!this.canDownload()) return this.unduhDariLinkPublik(ref, aksi, gagal);
    const bersih = (s: string) => s.replace(/[\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'tanpa-nama';
    let jumlah = 0;
    const telusuri = async (f: { id: string; name: string; mimeType: string }, dasar: string) => {
      if (f.mimeType === 'application/vnd.google-apps.folder') {
        const isi = await this.isiFolder(f.id);
        for (const anak of isi) await telusuri(anak, dasar ? `${dasar}/${bersih(f.name)}` : bersih(f.name));
        return;
      }
      try {
        const berkas = await this.unduhBerkas(f);
        await aksi({ path: `${dasar}${dasar ? '/' : ''}${bersih(berkas.nama)}`, data: berkas.data });
        jumlah++;
      } catch (e: any) {
        gagal(`${f.name}: ${e.message}`);
      }
    };
    const root = await this.metaBerkas(ref.id);
    if (root.mimeType === 'application/vnd.google-apps.folder') {
      for (const anak of await this.isiFolder(root.id)) await telusuri(anak, '');
    } else {
      await telusuri(root, '');
    }
    return jumlah;
  }

  folderUrl(id: string) {
    return `https://drive.google.com/drive/folders/${id}`;
  }

  async ensureFolder(name: string, parentId?: string): Promise<string> {
    const key = `${parentId ?? 'root'}/${name}`;
    const cached = this.folderCache.get(key);
    if (cached) return cached;
    const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const q = `name = '${esc(name)}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false and '${parentId ?? 'root'}' in parents`;
    const found = await this.api(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1`,
    );
    let id: string | undefined = found.files?.[0]?.id;
    if (!id) {
      const created = await this.api('https://www.googleapis.com/drive/v3/files?fields=id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          mimeType: 'application/vnd.google-apps.folder',
          ...(parentId ? { parents: [parentId] } : {}),
        }),
      });
      id = created.id as string;
    }
    this.folderCache.set(key, id);
    return id;
  }

  private async rootFolder() {
    return process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || (await this.ensureFolder('Asset UKK'));
  }

  async uploadKeFolderKelas(opts: { kelasNama: string; fileName: string; localPath: string }) {
    const root = await this.rootFolder();
    const folderId = await this.ensureFolder(opts.kelasNama, root);
    const buf = await fs.readFile(opts.localPath);
    const mime = MIME[extname(opts.fileName).toLowerCase()] ?? 'application/octet-stream';
    const boundary = `lms${Date.now()}`;
    const meta = JSON.stringify({ name: opts.fileName, parents: [folderId] });
    const head = Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`,
    );
    const tail = Buffer.from(`\r\n--${boundary}--`);
    const file = await this.api(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body: Buffer.concat([head, buf, tail]),
      },
    );
    this.logger.log(`Terunggah ke Drive: ${opts.kelasNama}/${opts.fileName}`);
    return {
      fileId: file.id as string,
      fileUrl: (file.webViewLink as string) ?? `https://drive.google.com/file/d/${file.id}/view`,
      folderUrl: this.folderUrl(folderId),
    };
  }
}
