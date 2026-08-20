import {
  Controller,
  Get,
  Put,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InquiryService } from './inquiry.service';
import type { Inquiry, InquiryListResponse } from '@shared/api.interface';

type InquiryStatus = 'new' | 'read' | 'replied' | 'archived';

@Controller('api/inquiries')
export class InquiryController {
  constructor(private readonly inquiryService: InquiryService) {}

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<InquiryListResponse> {
    return this.inquiryService.findAll({
      status,
      search,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Inquiry> {
    return this.inquiryService.findOne(Number(id));
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: InquiryStatus,
  ): Promise<{ id: string; status: string }> {
    const result = await this.inquiryService.updateStatus(Number(id), status);
    return { id: String(result.id), status: result.status };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.inquiryService.remove(Number(id));
  }
}
