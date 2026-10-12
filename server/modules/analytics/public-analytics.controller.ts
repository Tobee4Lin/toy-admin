import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AnalyticsService, type TrackPayload } from './analytics.service';

@Controller('api/public')
export class PublicAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @HttpCode(200)
  track(
    @Body() body: TrackPayload,
    @Headers('user-agent') userAgent?: string,
    @Req() req?: Request,
  ): Promise<{ recorded: boolean }> {
    // Extract real client IP from Nginx proxy headers
    let ip: string | null = null;
    const xff = req?.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff) {
      ip = xff.split(',')[0].trim();
    } else if (req?.ip) {
      ip = req.ip.replace(/^::ffff:/, '');
    }
    // Ignore local/private IPs
    if (ip && (ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '::1')) {
      ip = null;
    }
    return this.analyticsService.track(body, userAgent || '', ip);
  }
}
