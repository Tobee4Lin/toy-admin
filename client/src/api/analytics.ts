import { http } from '@client/src/utils/http';

export interface NameValue {
  name: string;
  value: number;
}

export interface DailyPoint {
  date: string;
  pv: number;
  uv: number;
}

export interface AnalyticsOverview {
  days: number;
  totals: { pv: number; uv: number };
  today: { pv: number; uv: number };
  yesterday: { pv: number; uv: number };
  daily: DailyPoint[];
  topPages: NameValue[];
  topReferrers: NameValue[];
  devices: NameValue[];
}

export const analyticsApi = {
  async getOverview(days = 30): Promise<AnalyticsOverview> {
    const res = await http.get('/api/analytics/overview', { params: { days } });
    return res.data;
  },
};
