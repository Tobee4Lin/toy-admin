import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Eye,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Globe,
  Mail,
  MessageSquare,
  Package,
  User,
  Building,
  Phone,
  Link as LinkIcon,
  Tag,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@client/src/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@client/src/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@client/src/components/ui/table';
import {
  listInquiries,
  getInquiry,
  updateInquiryStatus,
  deleteInquiry,
} from '@client/src/api/inquiries';
import { createCustomerFromInquiry } from '@client/src/api/customers';
import type { Inquiry, InquiryListResponse } from '@shared/api.interface';

const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'new', label: '新询盘' },
  { key: 'read', label: '已读' },
  { key: 'replied', label: '已回复' },
  { key: 'archived', label: '已归档' },
];

const STATUS_LABELS: Record<string, string> = {
  new: '新询盘',
  read: '已读',
  replied: '已回复',
  archived: '已归档',
};

const SOURCE_LABELS: Record<string, string> = {
  rfq: '快速询盘',
  catalog: '目录下载',
  contact: '联系表单',
};

const statusBadgeClass = (status: string): string => {
  switch (status) {
    case 'new':
      return 'bg-destructive text-destructive-foreground border-transparent';
    case 'read':
      return 'bg-[hsl(38_92%_50%)] text-white border-transparent';
    case 'replied':
      return 'bg-[hsl(152_60%_42%)] text-white border-transparent';
    case 'archived':
      return 'bg-[hsl(215_16%_80%)] text-[hsl(210_40%_13%)] border-transparent';
    default:
      return 'bg-muted text-muted-foreground border-transparent';
  }
};

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
};

const InquiriesPage = () => {
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [data, setData] = useState<InquiryListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Inquiry | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openId = params.get('open');
    if (openId && !detailId) {
      openDetail(openId);
    }
  }, [location.search]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listInquiries({
        status: activeStatus === 'all' ? undefined : activeStatus,
        search: search || undefined,
        page,
        pageSize,
      });
      setData(result);
    } catch (err) {
      toast.error('加载询盘列表失败');
    } finally {
      setLoading(false);
    }
  }, [activeStatus, search, page, pageSize]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleStatusTab = (key: string) => {
    setActiveStatus(key);
    setPage(1);
  };

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const inquiry = await getInquiry(id);
      setDetail(inquiry);
      // Auto mark as read if status is new
      if (inquiry.status === 'new') {
        await updateInquiryStatus(id, 'read');
        setDetail({ ...inquiry, status: 'read' });
        // Refresh list to reflect status change
        fetchList();
      }
    } catch (err) {
      toast.error('加载询盘详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetail(null);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!detail || statusUpdating) return;
    setStatusUpdating(true);
    try {
      await updateInquiryStatus(detail.id, newStatus);
      setDetail({ ...detail, status: newStatus as Inquiry['status'] });
      toast.success('状态已更新');
      fetchList();
    } catch (err) {
      toast.error('更新状态失败');
    } finally {
      setStatusUpdating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId || deleteLoading) return;
    setDeleteLoading(true);
    try {
      await deleteInquiry(deleteId);
      toast.success('询盘已删除');
      setDeleteId(null);
      if (detailId === deleteId) {
        closeDetail();
      }
      fetchList();
    } catch (err) {
      toast.error('删除失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-1">询盘管理</h1>
        <p className="text-muted-foreground text-sm">查看和管理来自全球客户的产品询盘</p>
      </div>

      {/* Toolbar: Status tabs + Search */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => {
            const isActive = activeStatus === tab.key;
            const isNew = tab.key === 'new';
            const newCount = data?.newInquiries ?? 0;
            return (
              <button
                key={tab.key}
                onClick={() => handleStatusTab(tab.key)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                  transition-colors duration-150
                  ${isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }
                `}
              >
                {tab.label}
                {isNew && data && (
                  <span className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-destructive text-white'}`}>
                    {newCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSearch} className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="搜索客户名/公司/邮箱/产品名"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
      </div>

      {/* Table */}
      <div className="bg-card rounded-md shadow-sm border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 pl-4"></TableHead>
              <TableHead className="w-40">日期</TableHead>
              <TableHead>客户名称</TableHead>
              <TableHead>公司</TableHead>
              <TableHead>国家</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>产品名称</TableHead>
              <TableHead className="w-24">来源</TableHead>
              <TableHead className="w-28">状态</TableHead>
              <TableHead className="w-32 text-right pr-4">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4"></TableCell>
              {Array.from({ length: 7 }).map((__, j) => (
                     <TableCell key={j}>
                       <Skeleton className="h-4 w-20" />
                     </TableCell>
                   ))}
                   <TableCell>
                     <Skeleton className="h-5 w-12 rounded-full" />
                   </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="pr-4">
                    <Skeleton className="h-8 w-20 rounded-md ml-auto" />
                  </TableCell>
                </TableRow>
              ))}

            {!loading && data?.items.length === 0 && (
              <TableRow>
                 <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  暂无询盘数据
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              data?.items.map((item) => (
                <TableRow key={item.id} className="h-12">
                  <TableCell className="pl-4">
                    {item.status === 'new' && (
                      <span className="inline-block size-2 rounded-full bg-destructive" />
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {formatDate(item.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.company}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.country}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.email}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {item.productName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {SOURCE_LABELS[item.source as keyof typeof SOURCE_LABELS] || item.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusBadgeClass(item.status)}>
                      {STATUS_LABELS[item.status] || item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const customer = await createCustomerFromInquiry(Number(item.id));
                            toast.success(`已转为客户：${customer.customerNo}`);
                          } catch (e: any) {
                            toast.error(e?.response?.data?.message || '转为客户失败');
                          }
                        }}
                        className="h-8 px-2 text-green-600 hover:text-green-700"
                      >
                        <UserPlus className="size-4" />
                        转客户
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetail(item.id)}
                        className="h-8 px-2 text-primary"
                      >
                        <Eye className="size-4" />
                        查看
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(item.id)}
                        className="h-8 px-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {!loading && data && data.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="text-sm text-muted-foreground">
              共 {data.total} 条，第 {data.page} / {totalPages} 页
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!detailId} onOpenChange={(open) => !open && closeDetail()}>
        <SheetContent side="right" className="w-[480px] sm:max-w-[480px] p-0 gap-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">询盘状态</span>
              {detail && (
                <Select
                  value={detail.status}
                  onValueChange={handleStatusChange}
                  disabled={statusUpdating}
                >
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">新询盘</SelectItem>
                    <SelectItem value="read">已读</SelectItem>
                    <SelectItem value="replied">已回复</SelectItem>
                    <SelectItem value="archived">已归档</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {detailLoading && (
              <div className="p-6 space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}

            {!detailLoading && detail && (
              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="size-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">客户信息</h3>
                  </div>
                  <div className="space-y-2.5 text-sm">
                    <InfoRow icon={<User className="size-3.5" />} label="姓名" value={detail.name} />
                    <InfoRow icon={<Building className="size-3.5" />} label="公司" value={detail.company} />
                    <InfoRow icon={<Globe className="size-3.5" />} label="国家" value={detail.country} />
                    <InfoRow icon={<Mail className="size-3.5" />} label="邮箱" value={detail.email} />
                    <InfoRow icon={<Phone className="size-3.5" />} label="WhatsApp" value={detail.whatsapp} />
                  </div>
                </section>

                {/* Product Info */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="size-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">产品信息</h3>
                  </div>
                  <div className="space-y-2.5 text-sm">
                    <InfoRow icon={<Package className="size-3.5" />} label="产品名称" value={detail.productName} />
                    <InfoRow icon={<Tag className="size-3.5" />} label="货号" value={detail.productItemNumber} mono />
                    <InfoRow icon={<Tag className="size-3.5" />} label="分类" value={detail.productCategory} />
                    <InfoRow icon={<Package className="size-3.5" />} label="预估数量" value={detail.estimatedQuantity} />
                  </div>
                </section>

                {/* Source page */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <LinkIcon className="size-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">来源页面</h3>
                  </div>
                  {detail.pageUrl ? (
                    <a
                      href={detail.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {detail.pageUrl}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </section>

                {/* Message */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="size-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">留言内容</h3>
                  </div>
                  <div className="rounded-md border border-border bg-background p-4 shadow-sm">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {detail.message || '（无留言内容）'}
                    </p>
                  </div>
                </section>

                {/* Inquiry source */}
                 <section>
                   <div className="flex items-center gap-2 mb-3">
                     <Globe className="size-4 text-primary" />
                     <h3 className="text-sm font-semibold text-foreground">询盘来源</h3>
                   </div>
                   <Badge variant="outline" className="text-xs">
                     {SOURCE_LABELS[detail.source as keyof typeof SOURCE_LABELS] || detail.source || 'rfq'}
                   </Badge>
                 </section>

                 {detail.productInterest && (
                   <section>
                     <div className="flex items-center gap-2 mb-3">
                       <Package className="size-4 text-primary" />
                       <h3 className="text-sm font-semibold text-foreground">感兴趣的产品</h3>
                     </div>
                     <p className="text-sm text-foreground">{detail.productInterest}</p>
                   </section>
                 )}

                 {detail.customizationRequirement && (
                   <section>
                     <div className="flex items-center gap-2 mb-3">
                       <MessageSquare className="size-4 text-primary" />
                       <h3 className="text-sm font-semibold text-foreground">定制需求</h3>
                     </div>
                     <div className="rounded-md border border-border bg-background p-4 shadow-sm">
                       <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                         {detail.customizationRequirement}
                       </p>
                     </div>
                   </section>
                 )}

                 {detail.selectedProducts && detail.selectedProducts.length > 0 && (
                   <section>
                     <div className="flex items-center gap-2 mb-3">
                       <Package className="size-4 text-primary" />
                       <h3 className="text-sm font-semibold text-foreground">
                         已选产品（{detail.selectedProducts.length}）
                       </h3>
                     </div>
                     <div className="space-y-2">
                       {detail.selectedProducts.map((p, idx) => (
                         <div
                           key={idx}
                           className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm"
                         >
                           <div className="flex flex-col">
                             <span className="text-foreground font-medium">{p.name}</span>
                             <span className="text-muted-foreground text-xs font-mono">
                               {p.itemNumber}
                             </span>
                           </div>
                           <span className="text-muted-foreground">x {p.quantity}</span>
                         </div>
                       ))}
                     </div>
                   </section>
                 )}
              </div>
            )}
          </div>

          {/* Footer */}
          {detail && (
            <div className="px-6 py-4 border-t border-border">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  setDeleteId(detail.id);
                }}
              >
                <Trash2 className="size-4" />
                删除询盘
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              删除后该询盘将无法恢复，确定要删除此条询盘吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive"
              disabled={deleteLoading}
            >
              {deleteLoading ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="flex items-start gap-3">
    <span className="text-muted-foreground mt-0.5">{icon}</span>
    <span className="text-muted-foreground w-20 shrink-0">{label}</span>
    <span className={`text-foreground flex-1 break-all ${mono ? 'font-mono' : ''}`}>
      {value || '—'}
    </span>
  </div>
);

export default InquiriesPage;
