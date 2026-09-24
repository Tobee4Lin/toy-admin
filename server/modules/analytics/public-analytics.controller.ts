import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
} from '@nestjs/common';
import { AnalyticsService, type TrackPayload } from './analytics.service';

@Controller('api/public')
export class PublicAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @HttpCode(200)
  track(
    @Body() body: TrackPayload,
    @Headers('user-agent') userAgent?: string,
  ): Promise<{ recorded: boolean }> {
    return this.analyticsService.track(body, userAgent || '');
  }
}
