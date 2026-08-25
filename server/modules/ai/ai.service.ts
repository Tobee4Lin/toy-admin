import { Injectable } from '@nestjs/common';

// AI Service - 模拟AI功能，预留真实API接入接口
// 配置真实AI API后，替换generate*方法即可

const COMPANY_NAMES = [
  'HappyKids Trading Co.', 'Sunrise Toys Distribution', 'Global Play Imports',
  'ToyWorld International', 'Rainbow Distributors Ltd.', 'Prime Toys Wholesale',
  'Oceanic Toy Suppliers', 'Bright Future Toys', 'Starlight Imports LLC',
  'DreamPlay Distribution', 'ToyMaster Group', 'FunZone Wholesalers',
  'Creative Kids Trading', 'Paradise Toys Inc.', 'ToyLand International',
];

const CITIES: Record<string, string[]> = {
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Dammam', 'Mecca'],
  'Vietnam': ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hai Phong'],
  'Brazil': ['Sao Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba'],
  'Chile': ['Santiago', 'Valparaiso', 'Concepcion', 'Antofagasta'],
  'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
  'Poland': ['Warsaw', 'Krakow', 'Wroclaw', 'Poznan'],
  'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Tijuana'],
  'Malaysia': ['Kuala Lumpur', 'Penang', 'Johor Bahru', 'Ipoh'],
  'USA': ['Los Angeles', 'New York', 'Chicago', 'Houston', 'Miami'],
};

const BUSINESS_TYPES = ['Importer', 'Distributor', 'Wholesaler', 'Toy Store Chain', 'E-commerce Seller', 'Trading Company'];

@Injectable()
export class AiService {
  // 生成获客搜索策略
  generateSearchStrategy(params: {
    productName: string;
    keywords: string[];
    hsCode?: string;
    industry?: string;
    targetCountries: string[];
    targetCustomerTypes: string[];
  }) {
    const sources = [
      { name: 'Google Search', query: `${params.productName} importer distributor ${params.targetCountries.join(' OR ')}`, priority: 'high' },
      { name: 'Google Maps', query: `${params.productName} wholesale near me`, priority: 'high' },
      { name: 'LinkedIn', query: `${params.productName} buyer purchasing manager`, priority: 'medium' },
      { name: 'B2B Directory', query: `Alibaba, GlobalSources, Made-in-China ${params.productName}`, priority: 'medium' },
      { name: 'Company Websites', query: `${params.productName} importer site:.com`, priority: 'high' },
      { name: 'Trade Show Exhibitor Lists', query: 'Toy Fair, Spielwarenmesse, Kids India exhibitors', priority: 'low' },
      { name: 'Industry Associations', query: 'Toy Association, ICTI member directories', priority: 'low' },
      { name: 'Import/Export Data', query: `HS Code ${params.hsCode || '9503'} import records`, priority: 'medium' },
      { name: 'Facebook', query: `${params.productName} wholesale group`, priority: 'low' },
      { name: 'Instagram', query: `#${params.productName.replace(/\s/g, '')} #toyimporter`, priority: 'low' },
    ];

    return {
      product: params.productName,
      keywords: params.keywords,
      targetCountries: params.targetCountries,
      targetCustomerTypes: params.targetCustomerTypes,
      estimatedLeads: params.targetCountries.length * 15 + 20,
      searchSources: sources,
      recommendedApproach: 'Start with Google Search and Company Websites for high-intent buyers, then supplement with LinkedIn for contact discovery.',
    };
  }

  // 模拟生成潜在客户列表
  generateLeads(params: {
    productName: string;
    targetCountries: string[];
    targetCustomerTypes: string[];
    count?: number;
  }) {
    const count = params.count || 15;
    const leads = [];

    for (let i = 0; i < count; i++) {
      const country = params.targetCountries[i % params.targetCountries.length];
      const cities = CITIES[country] || ['Unknown'];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const businessType = params.targetCustomerTypes[i % params.targetCustomerTypes.length] || BUSINESS_TYPES[i % BUSINESS_TYPES.length];
      const companyName = COMPANY_NAMES[i % COMPANY_NAMES.length] + (i > COMPANY_NAMES.length ? ` ${Math.floor(i / COMPANY_NAMES.length) + 1}` : '');

      const leadScore = this.calculateLeadScore({ businessType, country, productName: params.productName });
      const grade = this.scoreToGrade(leadScore);

      leads.push({
        companyName,
        website: `https://www.${companyName.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        country,
        city,
        industry: 'Toys & Games',
        businessType,
        companySize: ['Small (1-50)', 'Medium (51-200)', 'Large (200+)'][i % 3],
        estimatedScale: ['$1M-$5M', '$5M-$20M', '$20M+'][i % 3],
        productRelevance: ['High', 'Medium', 'High'][i % 3],
        potentialCustomerType: businessType,
        email: `info@${companyName.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        phone: this.generatePhone(country),
        whatsapp: this.generatePhone(country),
        linkedin: `https://linkedin.com/company/${companyName.toLowerCase().replace(/[^a-z]/g, '')}`,
        facebook: `https://facebook.com/${companyName.toLowerCase().replace(/[^a-z]/g, '')}`,
        instagram: `@${companyName.toLowerCase().replace(/[^a-z]/g, '')}`,
        contactPerson: ['John Smith', 'Maria Garcia', 'Ahmed Hassan', 'Yuki Tanaka', 'Anna Kowalski'][i % 5],
        jobTitle: ['Purchasing Manager', 'Import Manager', 'Owner', 'Buyer', 'Product Manager'][i % 5],
        leadScore,
        leadGrade: grade,
        scoreDetails: {
          productRelevance: 80 + Math.floor(Math.random() * 20),
          companySize: 60 + Math.floor(Math.random() * 40),
          isImporter: businessType.includes('Import') ? 100 : 50,
          isWholesaler: businessType.includes('Wholesal') ? 100 : 40,
          hasWebsite: 100,
          isActive: 70 + Math.floor(Math.random() * 30),
          hasContact: 80 + Math.floor(Math.random() * 20),
          targetCountry: 100,
          longTermPotential: 60 + Math.floor(Math.random() * 40),
        },
        source: ['Google Search', 'LinkedIn', 'B2B Directory', 'Company Website'][i % 4],
      });
    }

    return leads.sort((a, b) => b.leadScore - a.leadScore);
  }

  // 计算客户评分
  private calculateLeadScore(data: { businessType: string; country: string; productName: string }): number {
    let score = 50;
    if (data.businessType.includes('Import') || data.businessType.includes('Distribut')) score += 20;
    if (data.businessType.includes('Wholesal')) score += 10;
    if (['Saudi Arabia', 'UAE', 'Poland', 'Chile'].includes(data.country)) score += 10;
    score += Math.floor(Math.random() * 15);
    return Math.min(100, Math.max(0, score));
  }

  private scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' {
    if (score >= 80) return 'A';
    if (score >= 65) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  }

  private generatePhone(country: string): string {
    const codes: Record<string, string> = {
      'Saudi Arabia': '+966', 'Vietnam': '+84', 'Brazil': '+55',
      'Chile': '+56', 'UAE': '+971', 'Poland': '+48',
      'Mexico': '+52', 'Malaysia': '+60', 'USA': '+1',
    };
    const code = codes[country] || '+1';
    return `${code} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // 生成客户背调报告
  generateIntelligenceReport(companyName: string, website?: string) {
    return {
      basicInfo: {
        companyName,
        country: 'Saudi Arabia',
        city: 'Riyadh',
        address: 'King Fahd Road, Riyadh 12345',
        website: website || `https://www.${companyName.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        phone: '+966 11 234 5678',
        email: `info@${companyName.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        foundedYear: '2010',
        employeeCount: '50-200',
      },
      businessInfo: {
        types: ['Importer', 'Distributor', 'Wholesaler'],
        description: `${companyName} is a leading importer and distributor of toys and consumer goods in the GCC region, with established distribution channels across Saudi Arabia and neighboring markets.`,
      },
      mainProducts: [
        { category: 'Toys', confidence: 'High' },
        { category: 'Bubble Toys', confidence: 'High' },
        { category: 'Outdoor Toys', confidence: 'Medium' },
        { category: 'Gift Products', confidence: 'Medium' },
      ],
      brandInfo: {
        hasOwnBrand: true,
        ownBrands: ['HappyKids', 'FunPlay'],
        distributesImportedBrands: true,
        importedBrands: ['Hasbro', 'Mattel', 'Local Chinese Brands'],
        doesPrivateLabel: true,
        doesOEM: true,
      },
      marketCoverage: {
        primaryMarkets: ['Saudi Arabia', 'UAE', 'Bahrain', 'Kuwait'],
        secondaryMarkets: ['Oman', 'Qatar', 'Jordan'],
        distributionChannels: ['Retail Chains', 'Independent Stores', 'Online Marketplaces', 'Wholesale'],
      },
      socialMedia: {
        facebook: { url: 'https://facebook.com/example', followers: 25000, active: true, lastPost: '2026-08-15', engagementRate: '3.2%' },
        instagram: { url: '@example_toys', followers: 18500, active: true, lastPost: '2026-08-20', engagementRate: '4.8%' },
        linkedin: { url: 'https://linkedin.com/company/example', followers: 3200, active: true, lastPost: '2026-08-10' },
        tiktok: { url: '@example_toys', followers: 8900, active: true, lastPost: '2026-08-18' },
        youtube: { url: 'https://youtube.com/@example', subscribers: 5400, active: false, lastPost: '2026-05-20' },
        productUpdateFrequency: 'Weekly',
      },
      companyPotential: {
        overallScore: 82,
        breakdown: {
          companySize: 75,
          websiteQuality: 85,
          socialActivity: 80,
          productRange: 78,
          marketCoverage: 88,
          importActivity: 90,
          onlinePresence: 76,
        },
      },
      riskAnalysis: {
        overallRisk: 'Low',
        factors: [
          { type: 'positive', message: 'Website is active and professionally maintained', source: 'Website Analysis' },
          { type: 'positive', message: 'Active social media presence with recent posts', source: 'Social Media Scan' },
          { type: 'positive', message: 'Company appears in multiple trade directories', source: 'B2B Directory Check' },
          { type: 'info', message: 'No negative news found in public records', source: 'News Search', uncertainty: 'Limited public data available' },
          { type: 'info', message: 'Payment history not publicly available', source: 'Financial Data', uncertainty: 'Cannot verify without trade references' },
        ],
        note: 'Risk assessment is based on publicly available information. Lack of negative information does not guarantee zero risk. Recommend trade references and small initial orders.',
      },
      purchaseProbability: 'High',
      purchaseProbabilityReason: `${companyName} currently distributes imported toy brands and has an active distribution network in Saudi Arabia. Their product portfolio aligns well with bubble toys and outdoor play products.`,
      recommendation: {
        priority: 'High Priority',
        reason: 'The company already distributes imported toy brands and has an established distribution network in the GCC region. Their social media activity indicates active business operations.',
        recommendedAction: 'Contact via email and LinkedIn simultaneously. Reference their existing toy brands in the opening. Offer sample shipment for quality evaluation.',
        bestContact: 'Purchasing Manager / Import Manager',
      },
      contacts: [
        { name: 'Ahmed Al-Rashid', title: 'Purchasing Manager', email: 'ahmed@example.com', phone: '+966 50 123 4567', linkedin: 'https://linkedin.com/in/ahmed', priorityScore: 95, recommended: true },
        { name: 'Mohammed Ali', title: 'Owner / CEO', email: 'mohammed@example.com', phone: '+966 55 987 6543', linkedin: 'https://linkedin.com/in/mohammed', priorityScore: 88, recommended: true },
        { name: 'Sarah Johnson', title: 'Product Manager', email: 'sarah@example.com', phone: '+966 53 456 7890', linkedin: 'https://linkedin.com/in/sarah', priorityScore: 72, recommended: false },
      ],
    };
  }

  // 生成开发策略和开发信
  generateOutreach(params: {
    customerName: string;
    customerInfo?: any;
    productName: string;
    targetCountry: string;
  }) {
    const companyName = params.customerName;
    const product = params.productName;
    const country = params.targetCountry;

    const strategy = {
      customerProfile: params.customerInfo?.businessInfo?.types?.join(', ') || 'Importer/Distributor',
      marketContext: `${country} toy market analysis`,
      approach: 'Multi-channel outreach: Email first, LinkedIn connection request after 3 days, WhatsApp follow-up after 7 days if no response.',
      valueProposition: `Chenghai-based toy sourcing partner with ${product} expertise, competitive pricing, and full OEM/ODM capabilities.`,
      followUpSchedule: [
        { day: 0, channel: 'Email', action: 'Send initial cold email' },
        { day: 3, channel: 'LinkedIn', action: 'Send connection request with personalized note' },
        { day: 7, channel: 'Email', action: 'Follow-up email with product catalog attachment' },
        { day: 14, channel: 'WhatsApp', action: 'Short message with product photo' },
        { day: 21, channel: 'Email', action: 'Final follow-up, offer sample shipment' },
      ],
    };

    const coldEmail = {
      subject: `${product} Supplier from Chenghai - ${companyName}`,
      body: `Hi ${params.customerInfo?.contacts?.[0]?.name || 'there'},

I noticed that ${companyName} currently distributes a range of imported toy brands in ${country}, and your product portfolio appears to align well with our manufacturing capabilities.

We are a Chenghai-based toy sourcing partner specializing in ${product}, with:
- Direct access to 80+ vetted toy factories
- Competitive pricing and flexible MOQ
- Full OEM/ODM services (color, logo, packaging, custom molds)
- EN71/ASTM/CPSIA compliance support
- Sample turnaround within 7-10 days

I've attached our latest ${product} catalog for your reference. Would you be open to a brief call to discuss potential collaboration?

Best regards,
[Your Name]
[Your Company]
WhatsApp: [Your WhatsApp]`,
      personalizationPoints: [
        `Mentioned their existing toy brands`,
        `Referenced ${country} market`,
        `Highlighted ${product} category match`,
      ],
    };

    const linkedinMessage = `Hi ${params.customerInfo?.contacts?.[0]?.name || 'there'}, I came across ${companyName}'s profile and was impressed by your toy distribution business in ${country}. We manufacture ${product} in Chenghai, China. Would love to connect and explore potential collaboration.`;

    const facebookMessage = `Hello! We are a Chenghai-based ${product} manufacturer. Saw that ${companyName} distributes toys in ${country}. Would you be interested in our product catalog?`;

    const whatsappMessage = `Hi, this is [Your Name] from [Your Company]. We specialize in ${product} manufacturing in Chenghai, China. Noticed ${companyName}'s business in ${country}. May I send you our product catalog?`;

    return { strategy, coldEmail, linkedinMessage, facebookMessage, whatsappMessage };
  }

  // 邮件AI分类
  classifyEmail(emailData: { subject: string; body: string; fromEmail: string }) {
    const subject = emailData.subject.toLowerCase();
    const body = emailData.body.toLowerCase();

    let category: string = 'uncategorized';
    let summary = '';

    if (subject.includes('price') || body.includes('price') || body.includes('quotation') || body.includes('quote')) {
      category = 'price_request';
      summary = 'Customer is requesting pricing information.';
    } else if (subject.includes('sample') || body.includes('sample')) {
      category = 'sample_request';
      summary = 'Customer is requesting product samples.';
    } else if (subject.includes('interested') || body.includes('interested') || body.includes('would like')) {
      category = 'interested';
      summary = 'Customer has expressed interest in products.';
    } else if (subject.includes('not interested') || body.includes('not interested') || body.includes('no thanks')) {
      category = 'not_interested';
      summary = 'Customer is not interested at this time.';
    } else if (body.includes('current supplier') || body.includes('existing supplier') || body.includes('already have')) {
      category = 'have_supplier';
      summary = 'Customer already has a supplier but may be open to alternatives.';
    } else if (body.includes('follow up') || body.includes('later') || body.includes('next month')) {
      category = 'follow_up_later';
      summary = 'Customer requests follow-up at a later date.';
    }

    return { category, summary };
  }

  // 生成AI回复建议
  generateDraftReply(emailData: { category: string; subject: string; fromName?: string }) {
    const replies: Record<string, string> = {
      price_request: `Hi ${emailData.fromName || 'there'},

Thank you for your interest in our products. Please find attached our detailed price list and product catalog.

Key highlights:
- Competitive FOB Chenghai pricing
- Flexible MOQ starting from 500 pcs
- Sample available within 7-10 days
- Full OEM/ODM customization supported

Could you please share your target quantity and any specific requirements? I'll prepare a customized quotation for you.

Best regards,
[Your Name]`,
      sample_request: `Hi ${emailData.fromName || 'there'},

Thank you for your interest. We'd be happy to send you samples.

Sample details:
- Sample cost: USD 50 per item (refundable on bulk order)
- Sample lead time: 7-10 days
- Shipping: DHL/FedEx, 3-5 days delivery

Please confirm your shipping address and which specific products you'd like to sample. I'll arrange the PI for sample payment.

Best regards,
[Your Name]`,
      interested: `Hi ${emailData.fromName || 'there'},

Great to hear about your interest! I've attached our product catalog for your review.

To better serve you, could you share:
1. Target product categories
2. Estimated order quantity
3. Any customization requirements
4. Target market/country

I'll prepare a tailored proposal with pricing and lead time.

Best regards,
[Your Name]`,
      not_interested: `Hi ${emailData.fromName || 'there'},

Thank you for your response. I completely understand.

Should your sourcing needs change in the future, please feel free to reach out. We regularly update our product catalog and would be happy to share new arrivals.

Wishing you continued success.

Best regards,
[Your Name]`,
      have_supplier: `Hi ${emailData.fromName || 'there'},

Thank you for letting me know. I understand you have an existing supplier relationship.

We often work with buyers who want a secondary supplier for capacity backup, price comparison, or specialized product lines. If you ever need an alternative source or additional capacity, we'd be happy to provide a quotation for comparison.

No pressure at all — just keeping the door open.

Best regards,
[Your Name]`,
      follow_up_later: `Hi ${emailData.fromName || 'there'},

Thank you for your response. I'll follow up with you next month as requested.

In the meantime, please feel free to reach out if you have any questions or if your timeline changes. I've also attached our catalog for your reference.

Best regards,
[Your Name]`,
      uncategorized: `Hi ${emailData.fromName || 'there'},

Thank you for your email. I've noted your inquiry and will get back to you with detailed information shortly.

In the meantime, please feel free to share any specific requirements or questions you may have.

Best regards,
[Your Name]`,
    };

    return replies[emailData.category] || replies.uncategorized;
  }
}
