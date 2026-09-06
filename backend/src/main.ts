import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { createUploadAuthMiddleware } from './common/upload/upload-auth.middleware';
import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const uploadDir = join(process.cwd(), 'uploads');
  fs.mkdirSync(uploadDir, { recursive: true });
  const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.use(
    '/uploads',
    createUploadAuthMiddleware(app.get(PrismaService), app.get(JwtService)),
    express.static(uploadDir, {
      setHeaders(res, filePath) {
        res.setHeader('Access-Control-Allow-Origin', frontendOrigin);
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
  const host = process.env.HOST || '127.0.0.1';
  await app.listen(port, host);
  console.log(`Backend berjalan di http://${host}:${port}/api`);
}
bootstrap();
