import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AiService } from './ai.service';
import { AiLeadController } from './ai-lead.controller';
import { AiIntelligenceController } from './ai-intelligence.controller';
import { AiOutreachController } from './ai-outreach.controller';
import { EmailCenterController } from './email-center.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [
    AiLeadController,
    AiIntelligenceController,
    AiOutreachController,
    EmailCenterController,
  ],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
