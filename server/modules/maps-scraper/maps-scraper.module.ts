import { Module } from '@nestjs/common';
import { MapsScraperController } from './maps-scraper.controller';
import { MapsScraperService } from './maps-scraper.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MapsScraperController],
  providers: [MapsScraperService],
  exports: [MapsScraperService],
})
export class MapsScraperModule {}
