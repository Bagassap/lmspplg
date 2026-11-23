import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import { readFile, stat } from 'fs/promises';
import * as unzipper from 'unzipper';
import { createExtractorFromData } from 'node-unrar-js';

export type EntriArsip = { path: string; size: number };

const BATAS_BACA = 8 * 1024 * 1024;
const BATAS_RAR = 200 * 1024 * 1024;

export const jenisArsip = (nama: string): 'zip' | 'rar' | null => {
  const ext = extname(nama).toLowerCase();
  return ext === '.zip' ? 'zip' : ext === '.rar' ? 'rar' : null;
};

const bukaRar = async (abs: string) => {
  if ((await stat(abs)).size > BATAS_RAR) throw new BadRequestException('Arsip RAR terlalu besar untuk dibuka (maks 200 MB)');
  const buf = await readFile(abs);
  return createExtractorFromData({ data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer });
};

const norm = (p: string) => p.replace(/\\/g, '/').replace(/^\/+/, '');

export async function daftarArsip(abs: string, jenis: 'zip' | 'rar'): Promise<EntriArsip[]> {
  try {
    if (jenis === 'zip') {
      const dir = await unzipper.Open.file(abs);
      return dir.files
        .filter((f) => f.type === 'File')
        .map((f) => ({ path: norm(f.path), size: f.uncompressedSize }));
    }
    const ex = await bukaRar(abs);
    return [...ex.getFileList().fileHeaders]
      .filter((h) => !h.flags.directory)
      .map((h) => ({ path: norm(h.name), size: h.unpSize }));
  } catch {
    throw new BadRequestException('Arsip tidak bisa dibaca (rusak atau berpassword)');
  }
}

export type IsiArsip = { path: string; data: Buffer | NodeJS.ReadableStream };

const amanPath = (p: string) =>
  norm(p).split('/').filter((s) => s && s !== '.' && s !== '..').join('/');

const kupasAkar = (paths: string[]) => {
  let buang = '';
  let sisa = paths;
  while (sisa.length && sisa.every((p) => p.includes('/'))) {
    const akar = sisa[0].split('/')[0];
    if (!sisa.every((p) => p.split('/')[0] === akar)) break;
    buang += `${akar}/`;
    sisa = sisa.map((p) => p.slice(akar.length + 1));
  }
  return (p: string) => (buang && p.startsWith(buang) ? p.slice(buang.length) : p);
};

export async function ekstrakArsip(abs: string, jenis: 'zip' | 'rar', aksi: (e: IsiArsip) => Promise<void>): Promise<number> {
  let jumlah = 0;
  try {
    if (jenis === 'zip') {
      const dir = await unzipper.Open.file(abs);
      const berkas = dir.files.filter((f) => f.type === 'File' && amanPath(f.path));
      const pendek = kupasAkar(berkas.map((f) => amanPath(f.path)));
      for (const f of berkas) {
        await aksi({ path: pendek(amanPath(f.path)), data: f.stream() });
        jumlah++;
      }
      return jumlah;
    }
    const ex = await bukaRar(abs);
    const nama = [...ex.getFileList().fileHeaders].filter((h) => !h.flags.directory).map((h) => h.name);
    const pendek = kupasAkar(nama.map(amanPath).filter(Boolean));
    const hasil = ex.extract({ files: nama });
    let gagal: unknown = null;
    for (const f of hasil.files) {
      if (gagal || !f.extraction || !amanPath(f.fileHeader.name)) continue;
      try {
        await aksi({ path: pendek(amanPath(f.fileHeader.name)), data: Buffer.from(f.extraction) });
        jumlah++;
      } catch (e) {
        gagal = e;
      }
    }
    if (gagal) throw gagal;
    return jumlah;
  } catch {
    throw new BadRequestException('Arsip tidak bisa dibaca (rusak atau berpassword)');
  }
}

export async function bacaEntri(abs: string, jenis: 'zip' | 'rar', path: string): Promise<Buffer> {
  const target = norm(path);
  try {
    if (jenis === 'zip') {
      const dir = await unzipper.Open.file(abs);
      const f = dir.files.find((x) => x.type === 'File' && norm(x.path) === target);
      if (!f) throw new BadRequestException('Berkas tidak ada di arsip');
      if (f.uncompressedSize > BATAS_BACA) throw new BadRequestException('Berkas terlalu besar untuk dilihat');
      return await f.buffer();
    }
    const ex = await bukaRar(abs);
    const h = [...ex.getFileList().fileHeaders].find((x) => !x.flags.directory && norm(x.name) === target);
    if (!h) throw new BadRequestException('Berkas tidak ada di arsip');
    if (h.unpSize > BATAS_BACA) throw new BadRequestException('Berkas terlalu besar untuk dilihat');
    const hasil = ex.extract({ files: [h.name] });
    let isi: Buffer | null = null;
    for (const f of hasil.files) {
      if (f.extraction && !isi) isi = Buffer.from(f.extraction);
    }
    if (!isi) throw new BadRequestException('Berkas tidak bisa dibuka');
    return isi;
  } catch (e) {
    if (e instanceof BadRequestException) throw e;
    throw new BadRequestException('Arsip tidak bisa dibaca (rusak atau berpassword)');
  }
}

const MIME: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.pdf': 'application/pdf',
};
const TEKS = new Set([
  '.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html', '.htm', '.php', '.sql', '.xml',
  '.env', '.py', '.java', '.c', '.cpp', '.cs', '.yml', '.yaml', '.ini', '.log', '.csv', '.vue', '.blade', '.sh',
]);

export function jenisTayang(path: string): { tipe: string; ext: string } | null {
  const ext = extname(path).toLowerCase();
  if (ext === '.svg') return { tipe: 'text/plain; charset=utf-8', ext };
  if (MIME[ext]) return { tipe: MIME[ext], ext };
  if (TEKS.has(ext) || !ext) return { tipe: 'text/plain; charset=utf-8', ext };
  return null;
}
