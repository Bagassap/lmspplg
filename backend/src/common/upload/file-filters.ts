import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { extname } from 'path';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DOCUMENT_EXTENSIONS = ['.pdf', '.zip', '.ppt', '.pptx', '.doc', '.docx'];

function mimeFileFilter(allowed: string[]): MulterOptions['fileFilter'] {
  return (_req, file, cb) => {
    if (!allowed.includes(file.mimetype)) {
      cb(new BadRequestException(`Tipe file tidak didukung: ${file.mimetype}`), false);
      return;
    }
    cb(null, true);
  };
}

function extFileFilter(allowed: string[]): MulterOptions['fileFilter'] {
  return (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      cb(new BadRequestException(`Tipe file tidak didukung: ${ext || file.mimetype}`), false);
      return;
    }
    cb(null, true);
  };
}

export const imageUploadOptions: Pick<MulterOptions, 'fileFilter' | 'limits'> = {
  fileFilter: mimeFileFilter(IMAGE_MIME_TYPES),
  limits: { fileSize: 5 * 1024 * 1024 },
};

export const documentUploadOptions: Pick<MulterOptions, 'fileFilter' | 'limits'> = {
  // Divalidasi lewat ekstensi nama file, bukan MIME type — banyak HP
  // Android melaporkan MIME type generik/salah (mis. application/octet-stream)
  // untuk PDF/PPT/ZIP yang sebenarnya valid, menyebabkan file sah ditolak.
  fileFilter: extFileFilter(DOCUMENT_EXTENSIONS),
  // PPT/PPTX dengan gambar/video tertanam bisa jauh lebih besar dari
  // 20-50MB — dinaikkan ke 100MB (samakan dengan client_max_body_size
  // Nginx di deploy/nginx-lms.conf, yang diberi headroom lebih untuk
  // overhead multipart).
  limits: { fileSize: 100 * 1024 * 1024 },
};
