import { Module } from '@nestjs/common';
import { VideoMarketingController } from './video-marketing.controller';
import { VideoMarketingService } from './video-marketing.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [VideoMarketingController],
  providers: [VideoMarketingService],
  exports: [VideoMarketingService],
})
export class VideoMarketingModule {}
