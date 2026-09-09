/// <reference lib="dom" />
import { Logger } from '@nestjs/common';
import * as playwright from 'playwright';

const logger = new Logger('MapsScraper');

export interface ScrapeResult {
  keyword?: string;
  industry?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  rating?: string;
  reviewsCount?: number;
}

export interface ScrapeOptions {
  keyword: string;
  country: string;
  state?: string;
  city?: string;
  perArea: number;
  extractEmail: boolean;
  onLog?: (msg: string) => void;
  onProgress?: (completed: number, total: number) => void;
  shouldStop?: () => boolean;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = (min: number, max: number) => delay(Math.floor(Math.random() * (max - min) + min));

export class GoogleMapsScraper {
  private browser: playwright.Browser | null = null;
  private page: playwright.Page | null = null;

  async init(headless = true) {
    this.browser = await playwright.chromium.launch({
      headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });
    const context = await this.browser.newContext({
      locale: 'en-US',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
    });
    this.page = await context.newPage();
    await this.page.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (type === 'image' || type === 'media' || type === 'font') {
        route.abort();
      } else {
        route.continue();
      }
    });
  }

  async scrape(options: ScrapeOptions): Promise<ScrapeResult[]> {
    const { keyword, country, state, city, perArea, extractEmail, onLog, onProgress, shouldStop } = options;
    const results: ScrapeResult[] = [];
    const seen = new Set<string>();

    const location = [city, state, country].filter(Boolean).join(', ');
    const searchQuery = encodeURIComponent(`${keyword} ${location}`);
    const url = `https://www.google.com/maps/search/${searchQuery}`;

    onLog?.(`🌐 打开 Google Maps: ${keyword} in ${location}`);

    try {
      await this.page!.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await randomDelay(2000, 4000);

      const consentButton = await this.page.$('button[aria-label*="Accept all"], button:has-text("Accept all"), button:has-text("I agree")');
      if (consentButton) {
        await consentButton.click().catch(() => {});
        await randomDelay(1000, 2000);
      }

      onLog?.('📜 滚动加载结果列表...');

      const sidebarSelector = 'div[role="feed"]';
      let scrollAttempts = 0;
      const maxScrolls = Math.ceil(perArea / 7) + 3;

      while (scrollAttempts < maxScrolls) {
        if (shouldStop?.()) {
          onLog?.('⏹️ 采集已停止');
          break;
        }

        const items = await this.page!.$$('div[role="feed"] > div > div[jsaction]');
        if (items.length >= perArea) break;

        await this.page!.evaluate((selector) => {
          const el = document.querySelector(selector);
          if (el) el.scrollTop = el.scrollHeight;
        }, sidebarSelector).catch(() => {});

        await randomDelay(1500, 2500);
        scrollAttempts++;
        onProgress?.(Math.min(items.length, perArea), perArea);
      }

      const resultLinks = await this.page!.$$eval('div[role="feed"] a[href*="/maps/place/"]', (links) =>
        links.map(l => (l as HTMLAnchorElement).href).filter(Boolean)
      );

      const uniqueLinks = [...new Set(resultLinks)].slice(0, perArea);
      onLog?.(`🔍 找到 ${uniqueLinks.length} 个结果，开始提取详情...`);

      for (let i = 0; i < uniqueLinks.length; i++) {
        if (shouldStop?.()) {
          onLog?.('⏹️ 采集已停止');
          break;
        }

        try {
          const detail = await this.extractPlaceDetail(uniqueLinks[i], extractEmail, onLog);
          if (detail && !seen.has(detail.name)) {
            seen.add(detail.name);
            detail.keyword = keyword;
            detail.industry = keyword;
            results.push(detail);
            onLog?.(`✅ [${i + 1}/${uniqueLinks.length}] ${detail.name}`);
          }
        } catch (e) {
          onLog?.(`❌ 提取第 ${i + 1} 个结果失败: ${(e as Error).message}`);
        }
        onProgress?.(i + 1, uniqueLinks.length);
        await randomDelay(800, 1500);
      }

    } catch (e) {
      onLog?.(`❌ 采集出错: ${(e as Error).message}`);
      throw e;
    }

    onLog?.(`🎉 采集完成，共获取 ${results.length} 条有效数据`);
    return results;
  }

  private async extractPlaceDetail(placeUrl: string, extractEmail: boolean, onLog?: (msg: string) => void): Promise<ScrapeResult | null> {
    await this.page!.goto(placeUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await randomDelay(1500, 2500);

    const data = await this.page!.evaluate(() => {
      const r: any = {};

      const nameEl = document.querySelector('h1, [data-item-id="title"] span, .DUwDvf');
      r.name = nameEl?.textContent?.trim() || '';

      const ratingEl = document.querySelector('span[aria-label*="stars"], .F7nice span[aria-hidden="true"]');
      if (ratingEl) {
        const ratingText = ratingEl.textContent?.trim();
        if (ratingText && /^[\d.]+$/.test(ratingText)) r.rating = ratingText;
      }

      const reviewsEl = document.querySelector('span[aria-label*="reviews"], .F7nice span:last-child');
      if (reviewsEl) {
        const reviewsText = reviewsEl.textContent?.replace(/[^0-9]/g, '');
        if (reviewsText) r.reviewsCount = parseInt(reviewsText, 10);
      }

      const addressEl = document.querySelector('[data-item-id="address"] .rogA2c, button[data-item-id="address"] .fontBodyMedium');
      r.address = addressEl?.textContent?.trim() || '';

      const phoneEl = document.querySelector('[data-item-id*="phone"] .rogA2c, button[data-item-id*="phone"] .fontBodyMedium');
      r.phone = phoneEl?.textContent?.trim() || '';

      const websiteEl = document.querySelector('[data-item-id="authority"] a, a[data-item-id="authority"]');
      r.website = websiteEl ? (websiteEl as HTMLAnchorElement).href : '';

      return r;
    });

    if (!data.name) return null;

    const result: ScrapeResult = {
      name: data.name,
      address: data.address,
      phone: data.phone,
      website: data.website,
      rating: data.rating,
      reviewsCount: data.reviewsCount,
    };

    if (data.address) {
      const parts = data.address.split(',').map((s: string) => s.trim());
      if (parts.length >= 2) {
        result.city = parts[parts.length - 2] || '';
      }
      const zipMatch = data.address.match(/\b\d{4,6}\b/);
      if (zipMatch) result.zipCode = zipMatch[0];
    }

    if (data.phone && /^[+\d\s-]{8,}$/.test(data.phone)) {
      result.whatsapp = data.phone;
    }

    if (extractEmail && data.website) {
      try {
        result.email = await this.extractEmailFromWebsite(data.website);
        if (result.email) {
          onLog?.(`   📧 找到邮箱: ${result.email}`);
        }
      } catch {
        // ignore
      }
    }

    return result;
  }

  private async extractEmailFromWebsite(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
      } as any);
      const html = await response.text();
      const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (emailMatch) {
        const filtered = emailMatch.filter(e =>
          /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) &&
          !/\.(jpg|jpeg|png|gif|webp|svg|pdf|zip|rar|exe|mp4|mp3)$/i.test(e) &&
          !e.includes('example.com') &&
          !e.includes('domain.com') &&
          !e.includes('sentry') &&
          !e.includes('wix') &&
          !e.includes('wordpress') &&
          !e.includes('@2x') &&
          !e.includes('@3x')
        );
        if (filtered.length > 0) return filtered[0];
      }
      return '';
    } catch {
      return '';
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
      this.page = null;
    }
  }
}
