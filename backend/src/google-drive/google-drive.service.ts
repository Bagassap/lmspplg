import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import { extname } from 'path';

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

/**
 * Unggah berkas ke Google Drive milik admin lewat OAuth (refresh token).
 * Struktur: <folder induk> / <nama kelas> / <nama siswa - judul task>.<ext>
 * Dikonfigurasi lewat env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN,
 * dan (opsional) GOOGLE_DRIVE_ROOT_FOLDER_ID. Bila belum diisi, fitur ini dilewati.
 */
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

  folderUrl(id: string) {
    return `https://drive.google.com/drive/folders/${id}`;
  }

  /** Cari folder (nama + induk); buat bila belum ada. */
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

  /** Unggah satu berkas ke <root>/<kelas>/ dan kembalikan tautannya. */
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
