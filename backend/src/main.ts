import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Serve uploaded files.
  // NOTE: express.static is mounted before the NestJS pipeline, so app.enableCors()
  // headers do NOT apply here. CORS and Content-Disposition must be set explicitly
  // via setHeaders so the frontend (different port) can embed PDFs in iframes.
  const uploadDir = join(process.cwd(), 'uploads');
  fs.mkdirSync(uploadDir, { recursive: true });
  const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.use(
    '/uploads',
    express.static(uploadDir, {
      setHeaders(res, filePath) {
        // Allow cross-origin embedding (iframe PDF preview from frontend origin)
        res.setHeader('Access-Control-Allow-Origin', frontendOrigin);
        // For PDF files: explicitly inline so browser displays them, not downloads them
        if (filePath.toLowerCase().endsWith('.pdf')) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline');
        }
      },
    }),
  );

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend berjalan di http://localhost:${port}/api`);
}
bootstrap();
