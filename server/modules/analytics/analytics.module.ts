import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PublicAnalyticsController } from './public-analytics.controller';

@Module({
  controllers: [PublicAnalyticsController, AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
