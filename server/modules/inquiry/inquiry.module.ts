import { Module } from '@nestjs/common';
import { InquiryController } from './inquiry.controller';
import { PublicInquiryController } from './public-inquiry.controller';
import { InquiryService } from './inquiry.service';

@Module({
  controllers: [InquiryController, PublicInquiryController],
  providers: [InquiryService],
  exports: [InquiryService],
})
export class InquiryModule {}
