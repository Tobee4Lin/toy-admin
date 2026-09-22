import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { ProductService } from './product.service';
import type { PaginatedResponse, Product } from '@shared/api.interface';

@Controller('api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PaginatedResponse<Product>> {
    return this.productService.findAll({
      search,
      category,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  // 下载Excel模板
  @Get('template/download')
  @UseGuards(AuthGuard('jwt'))
  async downloadTemplate(@Res() res: Response) {
    const buffer = this.productService.generateTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=product_import_template.xlsx');
    res.send(buffer);
  }

  // 批量导入产品（JSON格式，前端已处理图片URL）
  @Post('batch-import-json')
  @UseGuards(AuthGuard('jwt'))
  async batchImportJson(@Body() body: { products: Array<Record<string, unknown>> }) {
    if (!body.products || !Array.isArray(body.products)) {
      return { success: 0, failed: 0, errors: [{ row: 0, message: '产品数据格式错误' }] };
    }
    return this.productService.batchImport(body.products);
  }

  // 批量导入产品
  @Post('batch-import')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async batchImport(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { success: 0, failed: 0, errors: [{ row: 0, message: '请上传Excel文件' }] };
    }
    const rows = this.productService.parseExcel(file.buffer);
    return this.productService.batchImport(rows);
  }

  // Static route BEFORE :id
  @Delete('batch')
  @UseGuards(AuthGuard('jwt'))
  async batchRemove(@Body() body: { ids: number[] }) {
    return this.productService.batchRemove(body.ids);
  }

  // 单独批量给已存在的产品分配图片（图片分批上传，按产品ID匹配）
  @Post('batch-images')
  @UseGuards(AuthGuard('jwt'))
  async batchAssignImages(
    @Body()
    body: {
      mode?: 'replace' | 'append';
      assignments: Array<{
        id: number;
        mainImage?: string | null;
        gallery?: string[];
      }>;
    },
  ) {
    if (!body.assignments || !Array.isArray(body.assignments)) {
      return { updated: 0, products: [], missing: [] };
    }
    return this.productService.batchAssignImages(body);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Product> {
    return this.productService.findOne(Number(id));
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() body: Partial<Product>): Promise<Product> {
    return this.productService.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() body: Partial<Product>,
  ): Promise<Product> {
    return this.productService.update(Number(id), body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.productService.remove(Number(id));
  }

  @Post(':id/featured')
  @UseGuards(AuthGuard('jwt'))
  async toggleFeatured(
    @Param('id') id: string,
  ): Promise<{ id: string; isFeatured: boolean }> {
    return this.productService.toggleFeatured(Number(id));
  }
}
