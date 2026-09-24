import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Eye,
  Users,
  CalendarDays,
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { analyticsApi, type AnalyticsOverview } from '@client/src/api/analytics';

const RANGE_OPTIONS = [
  { days: 7, label: '近 7 天' },
  { days: 30, label: '近 30 天' },
  { days: 90, label: '近 90 天' },
];

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  unknown: Activity,
};

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string;
  value: number | string;
  sub?: string;
  icon: typeof Eye;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    try {
      const res = await analyticsApi.getOverview(d);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  const deviceTotal = data?.devices.reduce((s, d) => s + d.value, 0) || 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">访问统计</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            已自动排除搜索引擎爬虫、监控探测与自动化工具流量
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {RANGE_OPTIONS.map((opt) => (
            <Button
              key={opt.days}
              variant={days === opt.days ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDays(opt.days)}
              className="h-8"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="区间浏览量 PV"
              value={data.totals.pv.toLocaleString()}
              sub={`近 ${data.days} 天页面访问总次数`}
              icon={Eye}
            />
            <StatCard
              title="区间访客数 UV"
              value={data.totals.uv.toLocaleString()}
              sub="按独立访客去重"
              icon={Users}
            />
            <StatCard
              title="今日"
              value={data.today.pv.toLocaleString()}
              sub={`UV ${data.today.uv.toLocaleString()}`}
              icon={Activity}
            />
            <StatCard
              title="昨日"
              value={data.yesterday.pv.toLocaleString()}
              sub={`UV ${data.yesterday.uv.toLocaleString()}`}
              icon={CalendarDays}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>访问趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.daily} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="currentColor" stopOpacity={0.25} className="text-primary" />
                        <stop offset="95%" stopColor="currentColor" stopOpacity={0} className="text-primary" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v: string) => v.slice(5)}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={20}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--card))',
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="pv"
                      name="浏览量 PV"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#pvGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="uv"
                      name="访客数 UV"
                      stroke="hsl(var(--chart-2, #10b981))"
                      strokeWidth={2}
                      fill="transparent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>热门页面 Top {data.topPages.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {data.topPages.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">暂无数据</p>
                  )}
                  {data.topPages.map((p) => {
                    const max = data.topPages[0]?.value || 1;
                    return (
                      <div key={p.name} className="flex items-center gap-3">
                        <span className="w-44 truncate font-mono text-xs" title={p.name}>
                          {p.name}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary/70"
                            style={{ width: `${(p.value / max) * 100}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs tabular-nums">{p.value}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>设备分布</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.devices.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">暂无数据</p>
                  )}
                  {data.devices.map((d) => {
                    const Icon = DEVICE_ICONS[d.name] || Activity;
                    const pct = deviceTotal ? Math.round((d.value / deviceTotal) * 100) : 0;
                    return (
                      <div key={d.name} className="flex items-center gap-3">
                        <Icon className="size-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{d.name}</span>
                        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                          {pct}%
                        </span>
                        <span className="w-8 text-right text-sm font-medium tabular-nums">
                          {d.value}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>来源网站</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.topReferrers.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      暂无外部来源
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {data.topReferrers.map((r) => (
                        <li key={r.name} className="flex items-center gap-2 text-sm">
                          <ExternalLink className="size-3.5 text-muted-foreground" />
                          <span className="flex-1 truncate" title={r.name}>
                            {r.name}
                          </span>
                          <span className="tabular-nums text-muted-foreground">{r.value}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
