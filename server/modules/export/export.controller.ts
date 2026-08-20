import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service';

@Controller('api/export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('products')
  async exportProducts(@Res() res: Response): Promise<void> {
    const data = await this.exportService.exportProducts();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="products.json"',
    );
    res.send(JSON.stringify(data, null, 2));
  }

  @Get('categories')
  async exportCategories(@Res() res: Response): Promise<void> {
    const data = await this.exportService.exportCategories();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="categories.json"',
    );
    res.send(JSON.stringify(data, null, 2));
  }

  @Get('blog')
  async exportBlog(@Res() res: Response): Promise<void> {
    const data = await this.exportService.exportBlog();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="blog.json"',
    );
    res.send(JSON.stringify(data, null, 2));
  }
}
