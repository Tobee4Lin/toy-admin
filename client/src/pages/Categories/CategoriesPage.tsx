import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit2, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { uploadFile } from '@/utils/upload';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import type { Category } from '@shared/api.interface';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@client/src/api/categories';
import { Image } from '@client/src/components/ui/image';

interface FormState {
  name: string;
  slug: string;
  description: string;
  productCount: number;
  accentColor: string;
  heroImageUrl: string;
  cardImageUrl: string;
}

const DEFAULT_FORM: FormState = {
  name: '',
  slug: '',
  description: '',
  productCount: 0,
  accentColor: '#1565FF',
  heroImageUrl: '',
  cardImageUrl: '',
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState('');
  const [deleting, setDeleting] = useState(false);

  const heroInputRef = useRef<HTMLInputElement>(null);
  const cardInputRef = useRef<HTMLInputElement>(null);
  const [heroUploading, setHeroUploading] = useState(false);
  const [cardUploading, setCardUploading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCategories();
      setCategories(data);
    } catch (err: unknown) {
      logger.error(`获取分类列表失败: ${String(err)}`);
      toast.error('获取分类列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setSlugManuallyEdited(false);
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      productCount: cat.productCount,
      accentColor: cat.accentColor || '#1565FF',
      heroImageUrl: cat.heroImageUrl,
      cardImageUrl: cat.cardImageUrl,
    });
    setSlugManuallyEdited(true);
    setDialogOpen(true);
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => ({ ...prev, name: value }));
    if (!slugManuallyEdited) {
      setForm((prev) => ({ ...prev, slug: slugify(value) }));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setForm((prev) => ({ ...prev, slug: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('请输入分类名称');
      return;
    }
    if (!form.slug.trim()) {
      toast.error('请输入分类标识');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description,
        productCount: Number(form.productCount) || 0,
        accentColor: form.accentColor,
        heroImageUrl: form.heroImageUrl,
        cardImageUrl: form.cardImageUrl,
      };
      if (editingId) {
        await updateCategory(editingId, payload);
        toast.success('分类更新成功');
      } else {
        await createCategory(payload);
        toast.success('分类创建成功');
      }
      setDialogOpen(false);
      fetchCategories();
    } catch (err: unknown) {
      logger.error(`保存分类失败: ${String(err)}`);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || '保存失败，请重试';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const openDelete = (cat: Category) => {
    setDeletingId(cat.id);
    setDeletingName(cat.name);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await deleteCategory(deletingId);
      toast.success('删除成功');
      setDeleteDialogOpen(false);
      fetchCategories();
    } catch (err: unknown) {
      logger.error(`删除分类失败: ${String(err)}`);
      toast.error('删除失败，请重试');
    } finally {
      setDeleting(false);
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'heroImageUrl' | 'cardImageUrl',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading =
      field === 'heroImageUrl' ? setHeroUploading : setCardUploading;
    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      setForm((prev) => ({ ...prev, [field]: url }));
      toast.success('图片上传成功');
    } catch (err: unknown) {
      logger.error(`图片上传失败: ${String(err)}`);
      toast.error(String(err));
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveImage = (field: 'heroImageUrl' | 'cardImageUrl') => {
    setForm((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">分类管理</h1>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          新增分类
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i: number) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="h-12">
                  <TableHead className="w-10 pl-4"></TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">产品数量</TableHead>
                  <TableHead>强调色</TableHead>
                  <TableHead className="text-right pr-4">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-12"
                    >
                      暂无分类数据
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((cat: Category) => (
                    <TableRow key={cat.id} className="h-12">
                      <TableCell className="pl-4">
                        <div
                          className="size-3 rounded-sm"
                          style={{ backgroundColor: cat.accentColor || '#e5e7eb' }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {cat.slug}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {cat.productCount}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="size-6 rounded-md border border-border"
                            style={{ backgroundColor: cat.accentColor || '#fff' }}
                          />
                          <span className="text-xs text-muted-foreground font-mono">
                            {cat.accentColor || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(cat)}
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => openDelete(cat)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? '编辑分类' : '新增分类'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">名称 <span className="text-destructive">*</span></Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleNameChange(e.target.value)
                }
                placeholder="请输入分类名称"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                value={form.slug}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleSlugChange(e.target.value)
                }
                placeholder="自动生成，可编辑"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-desc">描述</Label>
              <Textarea
                id="cat-desc"
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="请输入分类描述"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat-count">产品数量</Label>
                <Input
                  id="cat-count"
                  type="number"
                  value={form.productCount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((prev) => ({
                      ...prev,
                      productCount: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-accent">强调色</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-9 w-12 items-center justify-center rounded-md border border-input bg-transparent px-1"
                  >
                    <input
                      type="color"
                      value={form.accentColor}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setForm((prev) => ({
                          ...prev,
                          accentColor: e.target.value,
                        }))
                      }
                      className="h-6 w-8 cursor-pointer rounded bg-transparent border-0 p-0"
                    />
                  </div>
                  <Input
                    id="cat-accent"
                    value={form.accentColor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm((prev) => ({
                        ...prev,
                        accentColor: e.target.value,
                      }))
                    }
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>首图</Label>
              {form.heroImageUrl ? (
                <div className="relative inline-block">
                  <Image
                    src={form.heroImageUrl}
                    alt="首图预览"
                    className="h-24 w-24 rounded-md border border-border object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 size-6"
                    onClick={() => handleRemoveImage('heroImageUrl')}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    ref={heroInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleImageUpload(e, 'heroImageUrl')
                    }
                  />
                  <Button
                    variant="outline"
                    onClick={() => heroInputRef.current?.click()}
                    disabled={heroUploading}
                  >
                    {heroUploading ? (
                      <>
                        <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        上传中...
                      </>
                    ) : (
                      <>
                        <Upload className="size-4" />
                        上传首图
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>卡片图</Label>
              {form.cardImageUrl ? (
                <div className="relative inline-block">
                  <Image
                    src={form.cardImageUrl}
                    alt="卡片图预览"
                    className="h-24 w-24 rounded-md border border-border object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 size-6"
                    onClick={() => handleRemoveImage('cardImageUrl')}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    ref={cardInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleImageUpload(e, 'cardImageUrl')
                    }
                  />
                  <Button
                    variant="outline"
                    onClick={() => cardInputRef.current?.click()}
                    disabled={cardUploading}
                  >
                    {cardUploading ? (
                      <>
                        <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        上传中...
                      </>
                    ) : (
                      <>
                        <Upload className="size-4" />
                        上传卡片图
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除分类「{deletingName}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  删除中...
                </>
              ) : (
                '删除'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoriesPage;
