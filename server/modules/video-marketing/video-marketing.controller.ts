import { Body, Controller, Delete, Get, Param, Post, Query, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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

  @Get('materials')
  @UseGuards(AuthGuard('jwt'))
  async listMaterials(): Promise<Array<{ name: string; size: number; file: string }>> {
    return this.videoMarketingService.listMaterials();
  }

  @Post('materials/upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 },
  }))
  async uploadMaterial(@UploadedFile() file: Express.Multer.File): Promise<{ file: string }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded or file is empty');
    }
    const stored = await this.videoMarketingService.uploadMaterial(file.buffer, file.originalname);
    return { file: stored };
  }
}
