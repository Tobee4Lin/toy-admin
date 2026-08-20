import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BlogPostService } from './blog-post.service';
import type { BlogPost, PaginatedResponse } from '@shared/api.interface';

@Controller('api/blog-posts')
export class BlogPostController {
  constructor(private readonly blogPostService: BlogPostService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PaginatedResponse<BlogPost>> {
    return this.blogPostService.findAll({
      search,
      category,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BlogPost> {
    return this.blogPostService.findOne(Number(id));
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() body: Partial<BlogPost> & { title: string; slug: string }): Promise<BlogPost> {
    return this.blogPostService.create(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<BlogPost>,
  ): Promise<BlogPost> {
    return this.blogPostService.update(Number(id), body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.blogPostService.remove(Number(id));
  }
}
