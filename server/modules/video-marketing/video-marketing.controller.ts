import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VideoMarketingService, type VideoTask, type CreateVideoTaskDto, type VideoTaskStatus } from './video-marketing.service';

@Controller('api/video-marketing')
export class VideoMarketingController {
  constructor(private readonly videoMarketingService: VideoMarketingService) {}

  @Get('tasks')
  async getTasks(@Query('status') status?: VideoTaskStatus): Promise<VideoTask[]> {
    return this.videoMarketingService.findAll(status);
  }

  @Get('tasks/:id')
  async getTask(@Param('id') id: string): Promise<VideoTask> {
    return this.videoMarketingService.findOne(Number(id));
  }

  @Post('tasks')
  @UseGuards(AuthGuard('jwt'))
  async createTask(@Body() body: CreateVideoTaskDto): Promise<VideoTask> {
    return this.videoMarketingService.create(body);
  }

  @Post('tasks/:id/refresh')
  @UseGuards(AuthGuard('jwt'))
  async refreshTask(@Param('id') id: string): Promise<VideoTask> {
    return this.videoMarketingService.refreshStatus(Number(id));
  }

  @Delete('tasks/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteTask(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.videoMarketingService.delete(Number(id));
  }

  @Get('service/status')
  async checkService(): Promise<{ available: boolean; baseUrl: string }> {
    return this.videoMarketingService.checkService();
  }
}
