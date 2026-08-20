import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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

  // Static route BEFORE :id
  @Delete('batch')
  @UseGuards(AuthGuard('jwt'))
  async batchRemove(@Body() body: { ids: number[] }) {
    return this.productService.batchRemove(body.ids);
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
