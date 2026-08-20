import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CategoryService } from './category.service';
import type { Category } from '@shared/api.interface';

@Controller('api/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async findAll(): Promise<Category[]> {
    return this.categoryService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() body: Partial<Category>): Promise<Category> {
    return this.categoryService.create({
      name: body.name ?? '',
      slug: body.slug ?? '',
      description: body.description,
      productCount: body.productCount ?? 0,
      heroImageUrl: body.heroImageUrl,
      cardImageUrl: body.cardImageUrl,
      accentColor: body.accentColor,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<Category>): Promise<Category> {
    return this.categoryService.update(Number(id), body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.categoryService.remove(Number(id));
  }
}
