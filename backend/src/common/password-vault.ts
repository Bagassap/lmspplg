import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

function kunci(): Buffer {
  const sumber = process.env.PASSWORD_VIEW_KEY || process.env.JWT_SECRET;
  if (!sumber) throw new Error('PASSWORD_VIEW_KEY / JWT_SECRET belum diset');
  return createHash('sha256').update(sumber).digest();
}

export function enkripsiPassword(teks: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', kunci(), iv);
  const isi = Buffer.concat([c.update(teks, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), isi].map((b) => b.toString('base64')).join('.');
}

export function dekripsiPassword(nilai: string): string | null {
  try {
    const [iv, tag, isi] = nilai.split('.').map((x) => Buffer.from(x, 'base64'));
    const d = createDecipheriv('aes-256-gcm', kunci(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(isi), d.final()]).toString('utf8');
  } catch {
    return null;
  }
}
