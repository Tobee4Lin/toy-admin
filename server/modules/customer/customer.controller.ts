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
import { CustomerService, type Customer, type CustomerFollowup, type CustomerStats } from './customer.service';

@Controller('api/customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  // Read endpoints are public (no auth required)
  @Get('stats')
  async getStats(): Promise<CustomerStats> {
    return this.customerService.getStats();
  }

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('contactStatus') contactStatus?: string,
    @Query('priority') priority?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<{ items: Customer[]; total: number; page: number; pageSize: number }> {
    return this.customerService.findAll({
      search,
      contactStatus,
      priority,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  // Static route BEFORE :id
  @Post('from-inquiry')
  @UseGuards(AuthGuard('jwt'))
  async createFromInquiry(@Body() body: { inquiryId: number }): Promise<Customer> {
    return this.customerService.createFromInquiry(body.inquiryId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Customer & { followups: CustomerFollowup[] }> {
    return this.customerService.findOne(Number(id));
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() body: Partial<Customer>): Promise<Customer> {
    return this.customerService.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() body: Partial<Customer>,
  ): Promise<Customer> {
    return this.customerService.update(Number(id), body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.customerService.remove(Number(id));
  }

  // Followup endpoints
  @Post(':id/followups')
  @UseGuards(AuthGuard('jwt'))
  async addFollowup(
    @Param('id') id: string,
    @Body() body: { followDate: string; content?: string; feedback?: string },
  ): Promise<CustomerFollowup> {
    return this.customerService.addFollowup(Number(id), body);
  }

  @Delete('followups/:followupId')
  @UseGuards(AuthGuard('jwt'))
  async removeFollowup(@Param('followupId') followupId: string): Promise<{ success: boolean }> {
    return this.customerService.removeFollowup(Number(followupId));
  }

  @Put('followups/:followupId/toggle-replied')
  @UseGuards(AuthGuard('jwt'))
  async toggleFollowupReplied(
    @Param('followupId') followupId: string,
  ): Promise<{ id: string; isReplied: boolean }> {
    return this.customerService.toggleFollowupReplied(Number(followupId));
  }
}
