import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { extname } from 'path';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DOCUMENT_EXTENSIONS = ['.pdf', '.zip', '.rar', '.7z', '.ppt', '.pptx', '.doc', '.docx'];

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
  fileFilter: extFileFilter(DOCUMENT_EXTENSIONS),
  limits: { fileSize: 100 * 1024 * 1024 },
};
