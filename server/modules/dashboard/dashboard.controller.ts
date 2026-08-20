import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('recent-inquiries')
  getRecentInquiries(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 50)
      : 5;
    return this.dashboardService.getRecentInquiries(safeLimit);
  }

  @Get('category-distribution')
  getCategoryDistribution() {
    return this.dashboardService.getCategoryDistribution();
  }
}
