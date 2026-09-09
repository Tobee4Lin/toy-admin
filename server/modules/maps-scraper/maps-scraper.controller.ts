import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MapsScraperService, type MapsScraperTask, type MapsScraperResult, type MapsScraperPreset } from './maps-scraper.service';

@Controller('api/maps-scraper')
export class MapsScraperController {
  constructor(private readonly mapsScraperService: MapsScraperService) {}

  // Tasks
  @Get('tasks')
  async getTasks(): Promise<MapsScraperTask[]> {
    return this.mapsScraperService.findAllTasks();
  }

  @Get('tasks/:id')
  async getTask(@Param('id') id: string): Promise<MapsScraperTask> {
    return this.mapsScraperService.findTask(Number(id));
  }

  @Post('tasks')
  @UseGuards(AuthGuard('jwt'))
  async createTask(@Body() body: Partial<MapsScraperTask>): Promise<MapsScraperTask> {
    return this.mapsScraperService.createTask(body);
  }

  @Post('tasks/:id/start')
  @UseGuards(AuthGuard('jwt'))
  async startTask(@Param('id') id: string): Promise<MapsScraperTask> {
    return this.mapsScraperService.startScrape(Number(id));
  }

  @Post('tasks/:id/stop')
  @UseGuards(AuthGuard('jwt'))
  async stopTask(@Param('id') id: string): Promise<MapsScraperTask> {
    return this.mapsScraperService.stopScrape(Number(id));
  }

  @Delete('tasks/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteTask(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.mapsScraperService.deleteTask(Number(id));
  }

  // Results
  @Get('tasks/:id/results')
  async getResults(
    @Param('id') id: string,
    @Query('search') search?: string,
  ): Promise<MapsScraperResult[]> {
    return this.mapsScraperService.findResults(Number(id), search);
  }

  @Post('results/:id/add-to-customer')
  @UseGuards(AuthGuard('jwt'))
  async addToCustomer(@Param('id') id: string): Promise<MapsScraperResult> {
    return this.mapsScraperService.markAddedToCustomer(Number(id));
  }

  @Delete('results/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteResult(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.mapsScraperService.deleteResult(Number(id));
  }

  // Presets
  @Get('presets')
  async getPresets(): Promise<MapsScraperPreset[]> {
    return this.mapsScraperService.findPresets();
  }

  @Post('presets')
  @UseGuards(AuthGuard('jwt'))
  async createPreset(@Body() body: Partial<MapsScraperPreset>): Promise<MapsScraperPreset> {
    return this.mapsScraperService.createPreset(body);
  }

  @Delete('presets/:id')
  @UseGuards(AuthGuard('jwt'))
  async deletePreset(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.mapsScraperService.deletePreset(Number(id));
  }
}
