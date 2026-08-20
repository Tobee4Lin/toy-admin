import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, createReadStream } from 'fs';
import type { Response } from 'express';

const UPLOAD_DIR = join(process.cwd(), 'server', 'public', 'uploads');

@Controller('api/upload')
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return {
      url: `/api/upload/file/${file.filename}`,
      filename: file.filename,
    };
  }

  @Get('file/:filename')
  getFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(UPLOAD_DIR, filename);
    if (!existsSync(filePath)) {
      res.status(404).json({ message: 'File not found' });
      return;
    }
    res.setHeader('Content-Type', 'application/octet-stream');
    const stream = createReadStream(filePath);
    stream.pipe(res);
  }
}
