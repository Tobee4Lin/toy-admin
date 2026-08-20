import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Trash2,
  Pencil,
  Package,
} from 'lucide-react';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image } from '@/components/ui/image';

import {
  listProducts,
  deleteProduct,
  batchDeleteProducts,
  toggleFeatured,
} from '@/api/products';
import { listCategories } from '@/api/categories';
import type { Product, Category, PaginatedResponse } from '@shared/api.interface';

const ProductsPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResponse<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listProducts({
        search: search || undefined,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        page,
        pageSize,
      });
      setData(res);
      setSelectedIds([]);
    } catch (err: unknown) {
      logger.error(`获取产品列表失败: ${String(err)}`);
      toast.error('获取产品列表失败');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, page, pageSize]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await listCategories();
      setCategories(res);
    } catch (err: unknown) {
      logger.error(`获取分类列表失败: ${String(err)}`);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value, 10));
    setPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && data) {
      setSelectedIds(data.items.map((item: Product) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((itemId: string) => itemId !== id));
    }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    if (pendingToggle === id) return;
    setPendingToggle(id);
    try {
      // Optimistic update
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item: Product) =>
            item.id === id ? { ...item, isFeatured: !current } : item,
          ),
        };
      });
      const res = await toggleFeatured(id);
      toast.success(`已${res.isFeatured ? '设为精选' : '取消精选'}`);
    } catch (err: unknown) {
      logger.error(`切换精选状态失败: ${String(err)}`);
      toast.error('切换精选状态失败');
      // Revert
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item: Product) =>
            item.id === id ? { ...item, isFeatured: current } : item,
          ),
        };
      });
    } finally {
      setPendingToggle(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget);
      toast.success('产品已删除');
      setDeleteTarget(null);
      fetchProducts();
    } catch (err: unknown) {
      logger.error(`删除产品失败: ${String(err)}`);
      toast.error('删除产品失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await batchDeleteProducts(selectedIds);
      toast.success(`已删除 ${selectedIds.length} 个产品`);
      setBatchDeleteOpen(false);
      setSelectedIds([]);
      fetchProducts();
    } catch (err: unknown) {
      logger.error(`批量删除失败: ${String(err)}`);
      toast.error('批量删除失败');
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;
  const allSelected =
    data && data.items.length > 0 && selectedIds.length === data.items.length;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
              <CardTitle className="text-xl font-semibold">产品管理</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="搜索名称/货号/描述"
                  value={search}
                  onChange={handleSearchChange}
                  className="pl-8"
                />
              </div>
              <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="全部分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {categories.map((cat: Category) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={selectedIds.length === 0}
                onClick={() => setBatchDeleteOpen(true)}
              >
                <Trash2 className="mr-1.5 size-4" />
                批量删除
                {selectedIds.length > 0 && ` (${selectedIds.length})`}
              </Button>
              <Button size="sm" onClick={() => navigate('/products/new')}>
                <Plus className="mr-1.5 size-4" />
                添加产品
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="py-12">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Package className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>暂无产品</EmptyTitle>
                  <EmptyDescription>
                    点击右上角"添加产品"创建第一个产品
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="h-12">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="全选"
                    />
                  </TableHead>
                  <TableHead className="w-16">缩略图</TableHead>
                  <TableHead>产品名称</TableHead>
                  <TableHead className="font-mono">货号</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead className="text-right font-mono">MOQ</TableHead>
                  <TableHead className="text-center w-28">精选</TableHead>
                  <TableHead className="w-32 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item: Product) => (
                  <TableRow key={item.id} className="h-12">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(item.id, checked === true)
                        }
                        aria-label="选择"
                      />
                    </TableCell>
                    <TableCell>
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-md object-cover border border-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center">
                          <Package className="size-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {item.itemNumber || '-'}
                    </TableCell>
                    <TableCell>
                      {categories.find((c: Category) => c.slug === item.category)?.name || item.category || '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">{item.moq || 0}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={item.isFeatured}
                        onCheckedChange={() =>
                          handleToggleFeatured(item.id, item.isFeatured)
                        }
                        disabled={pendingToggle === item.id}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => navigate(`/products/${item.id}/edit`)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(item.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {data && data.total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>共 {data.total} 条</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 条/页</SelectItem>
                    <SelectItem value="20">20 条/页</SelectItem>
                    <SelectItem value="50">50 条/页</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Pagination className="justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      aria-disabled={page <= 1}
                      className={page <= 1 ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - page) <= 1 || p === 1 || p === totalPages)
                    .map((p, idx, arr) => (
                      <React.Fragment key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <PaginationItem>
                            <span className="px-2 text-muted-foreground">...</span>
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            isActive={p === page}
                            onClick={() => setPage(p)}
                            className="cursor-pointer"
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      </React.Fragment>
                    ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      aria-disabled={page >= totalPages}
                      className={page >= totalPages ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，确定要删除此产品吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handleDelete}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch delete confirm */}
      <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除选中的 {selectedIds.length} 个产品吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handleBatchDelete}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductsPage;
