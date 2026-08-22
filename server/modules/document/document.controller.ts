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
import { DocumentService, type DocumentData } from './document.service';

@Controller('api/documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  async findAll(@Query('type') type?: string): Promise<DocumentData[]> {
    return this.documentService.findAll(type);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<DocumentData> {
    return this.documentService.findOne(Number(id));
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() body: DocumentData): Promise<DocumentData> {
    return this.documentService.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() body: Partial<DocumentData>,
  ): Promise<DocumentData> {
    return this.documentService.update(Number(id), body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.documentService.remove(Number(id));
  }
}
