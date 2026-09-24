import { Injectable, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE_PROVIDER } from '../database/database.module';
import type { DbType } from '../../database/db';

export interface TrackPayload {
  path: string;
  referrer?: string;
  visitorId?: string;
  sessionId?: string;
  deviceType?: string;
}

// Known crawlers, monitors, headless tools and non-browser HTTP clients.
const BOT_UA_RE =
  /bot|crawl|spider|slurp|baidu|yandex|sogou|petalbot|bytespider|applebot|googleother|google-inspectiontool|google-read-aloud|google-site-verification|facebot|facebookexternal|facebookcatalog|instagram|pinterest|twitterbot|telegram|whatsapp|linkedinbot|discordbot|slackbot|duckduckgo|embedding|preview|monitor|pingdom|lighthouse|gtmetrix|ahrefs|semrush|mj12|dotbot|seznambot|screamingfrog|phantomjs|headless|selenium|puppeteer|playwright|newrelic|uptimerobot|datadog|prerender|curl|wget|python|java\/|go-http|node-fetch|axios|httpclient|libwww|capture|scanner|http\//i;

interface DailyRow {
  date: string;
  pv: number;
  uv: number;
}
interface NameValue {
  name: string;
  value: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(DATABASE_PROVIDER) private readonly db: DbType,
  ) {}

  static isBot(ua: string | undefined): boolean {
    if (!ua) return true;
    // Every real modern browser sends a Mozilla-compatible UA.
    if (!ua.includes('Mozilla')) return true;
    return BOT_UA_RE.test(ua);
  }

  async track(
    payload: TrackPayload,
    ua: string,
  ): Promise<{ recorded: boolean }> {
    if (AnalyticsService.isBot(ua)) return { recorded: false };

    const path = (payload.path || '').trim();
    if (!path.startsWith('/') || path.length > 500) {
      return { recorded: false };
    }

    const referrer = (payload.referrer || '').slice(0, 1000);
    let referrerHost: string | null = null;
    if (referrer) {
      try {
        referrerHost = new URL(referrer).hostname.replace(/^www\./, '');
      } catch {
        /* not a valid URL, ignore */
      }
    }

    // Server-side de-duplication: same session + path within 30 minutes.
    if (payload.sessionId) {
      const dup = this.db.get(sql`
        SELECT 1 AS hit FROM site_visit
        WHERE session_id = ${payload.sessionId}
          AND path = ${path}
          AND created_at > ${Date.now() - 30 * 60 * 1000}
        LIMIT 1
      `);
      if (dup) return { recorded: false };
    }

    this.db.run(sql`
      INSERT INTO site_visit
        (path, referrer, referrer_host, visitor_id, session_id, device_type)
      VALUES
        (${path}, ${referrer || null}, ${referrerHost}, ${payload.visitorId || null}, ${payload.sessionId || null}, ${payload.deviceType || null})
    `);
    return { recorded: true };
  }

  async overview(days: number) {
    const range = Math.min(Math.max(Number(days) || 30, 1), 365);
    const since = Date.now() - range * 86400000;

    const pvRow = this.db.get(sql`
      SELECT COUNT(*) AS c FROM site_visit WHERE created_at >= ${since}
    `) as { c: number } | undefined;
    const uvRow = this.db.get(sql`
      SELECT COUNT(DISTINCT visitor_id) AS c FROM site_visit WHERE created_at >= ${since}
    `) as { c: number } | undefined;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const t0 = todayStart.getTime();
    const y0 = t0 - 86400000;

    const rangeCount = (start: number, end: number, distinct = false) => {
      const row = this.db.get(sql`
        SELECT ${distinct ? sql`COUNT(DISTINCT visitor_id)` : sql`COUNT(*)`} AS c
        FROM site_visit WHERE created_at >= ${start} AND created_at < ${end}
      `) as { c: number } | undefined;
      return Number(row?.c || 0);
    };

    // Fill every day in range (including zero-traffic days).
    const dailyMap = new Map<string, DailyRow>();
    const rows = this.db.all(sql`
      SELECT
        strftime('%Y-%m-%d', created_at / 1000, 'unixepoch', 'localtime') AS date,
        COUNT(*) AS pv,
        COUNT(DISTINCT visitor_id) AS uv
      FROM site_visit
      WHERE created_at >= ${since}
      GROUP BY date
    `) as DailyRow[];
    rows.forEach((r) => dailyMap.set(r.date, { date: r.date, pv: Number(r.pv), uv: Number(r.uv) }));

    const daily: DailyRow[] = [];
    const cursor = new Date(todayStart);
    cursor.setDate(cursor.getDate() - (range - 1));
    for (let i = 0; i < range; i++) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
      daily.push(dailyMap.get(key) || { date: key, pv: 0, uv: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    const topPages = this.db.all(sql`
      SELECT path AS name, COUNT(*) AS value
      FROM site_visit WHERE created_at >= ${since}
      GROUP BY path ORDER BY value DESC LIMIT 20
    `) as NameValue[];

    const topReferrers = this.db.all(sql`
      SELECT referrer_host AS name, COUNT(*) AS value
      FROM site_visit
      WHERE created_at >= ${since}
        AND referrer_host IS NOT NULL AND referrer_host != ''
      GROUP BY referrer_host ORDER BY value DESC LIMIT 15
    `) as NameValue[];

    const devices = this.db.all(sql`
      SELECT COALESCE(device_type, 'unknown') AS name, COUNT(*) AS value
      FROM site_visit WHERE created_at >= ${since}
      GROUP BY device_type
    `) as NameValue[];

    return {
      days: range,
      totals: { pv: Number(pvRow?.c || 0), uv: Number(uvRow?.c || 0) },
      today: {
        pv: rangeCount(t0, t0 + 86400000),
        uv: rangeCount(t0, t0 + 86400000, true),
      },
      yesterday: {
        pv: rangeCount(y0, t0),
        uv: rangeCount(y0, t0, true),
      },
      daily: daily.map((r) => ({ ...r, pv: Number(r.pv), uv: Number(r.uv) })),
      topPages: topPages.map((r) => ({ ...r, value: Number(r.value) })),
      topReferrers: topReferrers.map((r) => ({ ...r, value: Number(r.value) })),
      devices: devices.map((r) => ({ ...r, value: Number(r.value) })),
    };
  }
}
