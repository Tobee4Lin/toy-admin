import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { z } from 'zod';
import { InquiryService } from './inquiry.service';
import type {
  PublicInquirySubmitRequest,
  PublicLeadSubmitRequest,
  PublicSubmitResponse,
} from '@shared/api.interface';

// Customer field validation (kept consistent with the frontend src/lib/validation.ts)
const nameField = z.string().trim().min(2, 'Please enter your name').max(100, 'Name is too long');
const companyField = z.string().trim().min(1, 'Company name is required').max(150, 'Company name is too long');
const countryField = z.string().trim().min(2, 'Please enter your country').max(100, 'Country is too long');
const emailField = z.string().trim().email('Please enter a valid email address').max(150, 'Email is too long');
const phoneRegex = /^[+]?[\d][\d\s().-]{4,23}$/;
const isValidPhone = (v: string) => {
  const digits = v.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 15 && phoneRegex.test(v.trim());
};
const whatsappField = z
  .string()
  .trim()
  .min(6, 'WhatsApp number is required')
  .max(25, 'WhatsApp number is too long')
  .refine((v) => isValidPhone(v), 'Please enter a valid WhatsApp number');
const whatsappOptionalField = z
  .string()
  .trim()
  .max(25, 'WhatsApp number is too long')
  .refine((v) => v === '' || isValidPhone(v), 'Please enter a valid WhatsApp number');

const inquirySchema = z.object({
  name: nameField,
  company: companyField,
  country: countryField,
  email: emailField,
  whatsapp: whatsappField,
  estimatedQuantity: z.string().trim().max(100).optional(),
  message: z.string().trim().max(3000, 'Message is too long').optional(),
  productName: z.string().trim().max(300).optional(),
  itemNumber: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  pageUrl: z.string().trim().max(1000).optional(),
  customizationRequirement: z.string().trim().max(3000).optional(),
  source: z.string().trim().max(100).optional(),
  attachments: z.array(z.object({ name: z.string().max(255), url: z.string().max(1000) })).optional(),
  selectedProducts: z
    .array(
      z.object({
        itemNumber: z.string().optional(),
        name: z.string().optional(),
        productName: z.string().optional(),
        quantity: z.number().optional(),
        category: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .max(500)
    .optional(),
});

const leadSchema = z.object({
  name: nameField,
  company: companyField,
  country: countryField,
  email: emailField,
  whatsapp: whatsappOptionalField.optional(),
  productInterest: z.string().trim().max(300).optional(),
  sourcePage: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
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
    const data = result.data;
    const selectedProducts = data.selectedProducts?.map((sp) => ({
      itemNumber: sp.itemNumber ?? '',
      name: sp.name ?? sp.productName ?? '',
      quantity: typeof sp.quantity === 'number' ? sp.quantity : 0,
    }));
    return this.inquiryService.submitPublicInquiry({
      ...data,
      selectedProducts,
    } as PublicInquirySubmitRequest);
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
