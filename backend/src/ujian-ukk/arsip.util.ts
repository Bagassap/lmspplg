import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import * as unzipper from 'unzipper';
import { createExtractorFromFile } from 'node-unrar-js';

export type EntriArsip = { path: string; size: number };

const BATAS_BACA = 8 * 1024 * 1024;

export const jenisArsip = (nama: string): 'zip' | 'rar' | null => {
  const ext = extname(nama).toLowerCase();
  return ext === '.zip' ? 'zip' : ext === '.rar' ? 'rar' : null;
};

const norm = (p: string) => p.replace(/\\/g, '/').replace(/^\/+/, '');

// Daftar isi arsip tanpa mengekstrak ke disk.
export async function daftarArsip(abs: string, jenis: 'zip' | 'rar'): Promise<EntriArsip[]> {
  try {
    if (jenis === 'zip') {
      const dir = await unzipper.Open.file(abs);
      return dir.files
        .filter((f) => f.type === 'File')
        .map((f) => ({ path: norm(f.path), size: f.uncompressedSize }));
    }
    const ex = await createExtractorFromFile({ filepath: abs });
    return [...ex.getFileList().fileHeaders]
      .filter((h) => !h.flags.directory)
      .map((h) => ({ path: norm(h.name), size: h.unpSize }));
  } catch {
    throw new BadRequestException('Arsip tidak bisa dibaca (rusak atau berpassword)');
  }
}

// Membaca satu berkas di dalam arsip (dibatasi ukurannya).
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
    const ex = await createExtractorFromFile({ filepath: abs });
    const h = [...ex.getFileList().fileHeaders].find((x) => !x.flags.directory && norm(x.name) === target);
    if (!h) throw new BadRequestException('Berkas tidak ada di arsip');
    if (h.unpSize > BATAS_BACA) throw new BadRequestException('Berkas terlalu besar untuk dilihat');
    // Arsip RAR solid hanya bisa diekstrak berurutan; extract() memakai nama asli dari header.
    const hasil = ex.extract({ files: [h.name] });
    for (const f of hasil.files) {
      if (f.extraction) return Buffer.from(f.extraction);
    }
    throw new BadRequestException('Berkas tidak bisa dibuka');
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

// Jenis tayang aman: html/svg selalu dilayani sebagai teks agar skrip siswa tidak dieksekusi.
export function jenisTayang(path: string): { tipe: string; ext: string } | null {
  const ext = extname(path).toLowerCase();
  if (ext === '.svg') return { tipe: 'text/plain; charset=utf-8', ext };
  if (MIME[ext]) return { tipe: MIME[ext], ext };
  if (TEKS.has(ext) || !ext) return { tipe: 'text/plain; charset=utf-8', ext };
  return null;
}
