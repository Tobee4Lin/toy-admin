import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { z } from 'zod';
import { InquiryService } from './inquiry.service';
import type {
  PublicInquirySubmitRequest,
  PublicLeadSubmitRequest,
  PublicSubmitResponse,
} from '@shared/api.interface';

const inquirySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().min(1, 'Company is required'),
  country: z.string().min(1, 'Country is required'),
  email: z.string().email('Invalid email format'),
  whatsapp: z.string().optional(),
  estimatedQuantity: z.string().optional(),
  message: z.string().optional(),
  productName: z.string().optional(),
  itemNumber: z.string().optional(),
  category: z.string().optional(),
  pageUrl: z.string().optional(),
  customizationRequirement: z.string().optional(),
  source: z.string().optional(),
  selectedProducts: z
    .array(
      z.object({
        itemNumber: z.string(),
        name: z.string(),
        quantity: z.number(),
      }),
    )
    .optional(),
});

const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().min(1, 'Company is required'),
  country: z.string().min(1, 'Country is required'),
  email: z.string().email('Invalid email format'),
  whatsapp: z.string().optional(),
  productInterest: z.string().optional(),
  sourcePage: z.string().optional(),
  category: z.string().optional(),
});

@Controller('api/public')
export class PublicInquiryController {
  constructor(private readonly inquiryService: InquiryService) {}

  @Post('inquiries')
  @HttpCode(200)
  async submitInquiry(
    @Body() body: PublicInquirySubmitRequest,
  ): Promise<PublicSubmitResponse> {
    const result = inquirySchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return {
        success: false,
        message: firstError?.message ?? 'Invalid request data',
      };
    }
    return this.inquiryService.submitPublicInquiry(
      result.data as PublicInquirySubmitRequest,
    );
  }

  @Post('leads')
  @HttpCode(200)
  async submitLead(
    @Body() body: PublicLeadSubmitRequest,
  ): Promise<PublicSubmitResponse> {
    const result = leadSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return {
        success: false,
        message: firstError?.message ?? 'Invalid request data',
      };
    }
    return this.inquiryService.submitPublicLead(
      result.data as PublicLeadSubmitRequest,
    );
  }
}
