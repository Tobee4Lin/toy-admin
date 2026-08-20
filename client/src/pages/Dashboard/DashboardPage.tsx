import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  FolderTree,
  FileText,
  MessageSquare,
  ChevronRight,
  Plus,
  Eye,
  Settings,
  PenLine,
} from 'lucide-react';
import { logger } from '@/utils/logger';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';

import * as dashboardApi from '@client/src/api/dashboard';
import type {
  DashboardStats,
  CategoryDistribution,
  Inquiry,
} from '@shared/api.interface';

const STAT_ICON_BG = 'bg-primary/10 text-primary';

const statusBadgeClass = (status: Inquiry['status']): string => {
  switch (status) {
    case 'new':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'read':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'replied':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'archived':
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const statusLabel = (status: Inquiry['status']): string => {
  switch (status) {
    case 'new':
      return '新询盘';
    case 'read':
      return '已读';
    case 'replied':
      return '已回复';
    case 'archived':
      return '已归档';
    default:
      return status;
  }
};

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} 天前`;
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
};

const StatCard = ({
  icon: Icon,
  value,
  label,
  hasDot,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  hasDot?: boolean;
  loading: boolean;
}) => (
  <Card className="shadow-sm">
    <CardContent className="flex items-center gap-4 p-6">
      <div
        className={`relative flex h-12 w-12 items-center justify-center rounded-md ${STAT_ICON_BG}`}
      >
        <Icon className="h-6 w-6" />
        {hasDot && (
          <span className="absolute -right-1 -top-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
          </span>
        )}
      </div>
      <div className="flex flex-col">
        {loading ? (
          <>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="mt-2 h-4 w-16" />
          </>
        ) : (
          <>
            <span className="text-3xl font-semibold tabular-nums leading-tight text-foreground">
              {value}
            </span>
            <span className="mt-1 text-sm text-muted-foreground">{label}</span>
          </>
        )}
      </div>
    </CardContent>
  </Card>
);

const InquiriesSkeleton = () => (
  <div className="space-y-4">
    {[0, 1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    ))}
  </div>
);

const QuickActionItem = ({
  icon: Icon,
  label,
  to,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: string;
}) => (
  <Link
    to={to}
    className="group flex items-center justify-between rounded-md px-3 py-3 transition-colors hover:bg-accent"
  >
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
  </Link>
);

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [distribution, setDistribution] = useState<CategoryDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async (): Promise<void> => {
      try {
        const [statsRes, inqRes, distRes] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentInquiries(5),
          dashboardApi.getCategoryDistribution(),
        ]);
        if (!active) return;
        setStats(statsRes);
        setInquiries(inqRes.items);
        setDistribution(distRes.items);
      } catch (err) {
        logger.error('Dashboard load failed', err as Error);
        if (!active) return;
        setError('数据加载失败');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const chartOption: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: distribution.map((d) => d.categoryName),
      axisLabel: {
        interval: 0,
        rotate: distribution.length > 5 ? 20 : 0,
      },
      boundaryGap: true,
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
    },
    series: [
      {
        type: 'bar',
        data: distribution.map((d) => ({
          value: d.productCount,
          itemStyle: {
            color: d.accentColor || '#1565FF',
            borderRadius: [4, 4, 0, 0],
          },
        })),
        barMaxWidth: 48,
      },
    ],
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">仪表盘概览</h1>
        <p className="text-sm text-muted-foreground">
          实时掌握产品、询盘与内容数据，快速进入常用操作
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div
        data-ai-section-type="card-stat"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          icon={Package}
          value={stats?.totalProducts ?? 0}
          label="产品总数"
          loading={loading}
        />
        <StatCard
          icon={FolderTree}
          value={stats?.totalCategories ?? 0}
          label="分类总数"
          loading={loading}
        />
        <StatCard
          icon={FileText}
          value={stats?.totalBlogPosts ?? 0}
          label="博客文章数"
          loading={loading}
        />
        <StatCard
          icon={MessageSquare}
          value={stats?.newInquiries ?? 0}
          label="新增询盘"
          hasDot
          loading={loading}
        />
      </div>

      {/* Recent inquiries + Quick actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold">最近询盘</CardTitle>
            <Link
              to="/inquiries"
              className="text-sm font-medium text-primary hover:underline"
            >
              查看全部
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <InquiriesSkeleton />
            ) : inquiries.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                暂无询盘
              </div>
            ) : (
              <div className="divide-y divide-border">
                {inquiries.map((inq) => (
                  <Link
                    key={inq.id}
                    to={`/inquiries?open=${inq.id}`}
                    className="flex items-center justify-between py-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {inq.name || '—'}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {inq.company || '—'}
                      </span>
                      <span className="mt-0.5 truncate text-xs text-muted-foreground">
                        {inq.productName || '—'}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 pl-4">
                      <Badge
                        variant="outline"
                        className={statusBadgeClass(inq.status)}
                      >
                        {statusLabel(inq.status)}
                      </Badge>
                      <span className="w-20 text-right text-xs text-muted-foreground">
                        {formatTime(inq.createdAt)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">快捷操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <QuickActionItem icon={Plus} label="添加产品" to="/products/new" />
              <QuickActionItem icon={PenLine} label="发布博客" to="/blog/new" />
              <QuickActionItem icon={Eye} label="查看询盘" to="/inquiries" />
              <QuickActionItem icon={Settings} label="导出数据" to="/settings" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category distribution chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            产品分类分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[320px] w-full" />
          ) : distribution.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
              暂无分类数据
            </div>
          ) : (
            <ReactECharts
              option={chartOption}
              theme="ud"
              className="h-[320px] w-full"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
