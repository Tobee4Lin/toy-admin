import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Upload,
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { logger } from '@/utils/logger';
import { uploadFile } from '@/utils/upload';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image } from '@/components/ui/image';
import { Skeleton } from '@/components/ui/skeleton';
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

import { createProduct, updateProduct, getProduct } from '@/api/products';
import { listCategories } from '@/api/categories';
import type { Product, Category } from '@shared/api.interface';

const productSchema = z.object({
  name: z.string().min(1, '产品名称不能为空'),
  slug: z.string().min(1, 'Slug 不能为空'),
  itemNumber: z.string().default(''),
  category: z.string().default(''),
  description: z.string().default(''),
  features: z.array(z.string()).default([]),
  specifications: z.record(z.string()).default({}),
  moq: z.coerce.number().int().min(0, 'MOQ 不能为负数').default(0),
  customizationAvailable: z.boolean().default(false),
  imageUrl: z.string().default(''),
  gallery: z.array(z.string()).default([]),
  packagingInfo: z.string().default(''),
  leadTime: z.string().default(''),
  ageGroup: z.string().default(''),
  priceRange: z.string().default(''),
  isFeatured: z.boolean().default(false),
});

type ProductFormData = z.infer<typeof productSchema>;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const ProductFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [cancelOpen, setCancelOpen] = useState(false);

  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      slug: '',
      itemNumber: '',
      category: '',
      description: '',
      features: [],
      specifications: {},
      moq: 0,
      customizationAvailable: false,
      imageUrl: '',
      gallery: [],
      packagingInfo: '',
      leadTime: '',
      ageGroup: '',
      priceRange: '',
      isFeatured: false,
    },
  });

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
    if (!isEdit || !id) return;
    const loadProduct = async () => {
      try {
        const product = await getProduct(id);
        form.reset({
          name: product.name,
          slug: product.slug,
          itemNumber: product.itemNumber,
          category: product.category,
          description: product.description,
          features: product.features,
          specifications: product.specifications,
          moq: product.moq,
          customizationAvailable: product.customizationAvailable,
          imageUrl: product.imageUrl,
          gallery: product.gallery,
          packagingInfo: product.packagingInfo,
          leadTime: product.leadTime,
          ageGroup: product.ageGroup,
          priceRange: product.priceRange,
          isFeatured: product.isFeatured,
        });
      } catch (err: unknown) {
        logger.error(`获取产品详情失败: ${String(err)}`);
        toast.error('获取产品详情失败');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [isEdit, id, form]);

  // Auto-generate slug from name (only when user hasn't manually edited it)
  const [slugEdited, setSlugEdited] = useState(false);
  const nameValue = form.watch('name');
  const slugValue = form.watch('slug');
  const imageUrl = form.watch('imageUrl');
  const gallery = form.watch('gallery');

  useEffect(() => {
    if (slugEdited || isEdit) return;
    const generated = slugify(nameValue);
    if (generated !== slugValue) {
      form.setValue('slug', generated, { shouldValidate: false });
    }
  }, [nameValue, slugEdited, form, slugValue, isEdit]);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugEdited(true);
    form.setValue('slug', e.target.value, { shouldValidate: true });
  };

  // Features dynamic list
  const features = form.watch('features');
  const addFeature = () => {
    form.setValue('features', [...features, '']);
  };
  const updateFeature = (index: number, value: string) => {
    const next = [...features];
    next[index] = value;
    form.setValue('features', next);
  };
  const removeFeature = (index: number) => {
    const next = features.filter((_: string, i: number) => i !== index);
    form.setValue('features', next);
  };

  // Specifications dynamic key-value
  const specifications = form.watch('specifications');
  const specKeys = Object.keys(specifications);
  const addSpecification = () => {
    form.setValue('specifications', { ...specifications, '': '' });
  };
  const updateSpecKey = (oldKey: string, newKey: string) => {
    const next: Record<string, string> = {};
    for (const k of specKeys) {
      if (k === oldKey) {
        next[newKey] = specifications[oldKey];
      } else {
        next[k] = specifications[k];
      }
    }
    form.setValue('specifications', next);
  };
  const updateSpecValue = (key: string, value: string) => {
    form.setValue('specifications', { ...specifications, [key]: value });
  };
  const removeSpecification = (key: string) => {
    const next = { ...specifications };
    delete next[key];
    form.setValue('specifications', next);
  };

  // Image upload
  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const { url } = await uploadFile(file);
      form.setValue('imageUrl', url);
      toast.success('主图上传成功');
    } catch (err: unknown) {
      logger.error(`主图上传失败: ${String(err)}`);
      toast.error('图片上传失败');
    } finally {
      setImageUploading(false);
      if (mainImageInputRef.current) mainImageInputRef.current.value = '';
    }
  };

  const removeMainImage = () => {
    form.setValue('imageUrl', '');
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setGalleryUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const { url } = await uploadFile(file);
        urls.push(url);
      }
      const currentGallery = form.getValues('gallery');
      form.setValue('gallery', [...currentGallery, ...urls]);
      toast.success(`成功上传 ${urls.length} 张图片`);
    } catch (err: unknown) {
      logger.error(`画廊上传失败: ${String(err)}`);
      toast.error('部分图片上传失败');
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const removeGalleryImage = (index: number) => {
    const currentGallery = form.getValues('gallery');
    form.setValue('gallery', currentGallery.filter((_: string, i: number) => i !== index));
  };

  const onSubmit = async (data: ProductFormData, andReturn: boolean) => {
    setSaving(true);
    try {
      // Clean specs: remove empty keys
      const cleanSpecs: Record<string, string> = {};
      for (const [k, v] of Object.entries(data.specifications)) {
        if (k.trim()) cleanSpecs[k.trim()] = v;
      }
      const cleanFeatures = data.features.filter((f: string) => f.trim() !== '');

      const payload = {
        ...data,
        features: cleanFeatures,
        specifications: cleanSpecs,
      };

      if (isEdit && id) {
        await updateProduct(id, payload);
        toast.success('产品已更新');
      } else {
        const created = await createProduct(payload);
        toast.success('产品已创建');
        if (!andReturn && created.id) {
          navigate(`/products/${created.id}/edit`, { replace: true });
          return;
        }
      }

      if (andReturn) {
        navigate('/products');
      }
    } catch (err: unknown) {
      logger.error(`保存产品失败: ${String(err)}`);
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '保存失败';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndReturn = form.handleSubmit((data) => onSubmit(data, true));
  const handleSaveAndContinue = form.handleSubmit((data) => onSubmit(data, false));

  const handleCancel = () => {
    const isDirty = form.formState.isDirty;
    if (isDirty) {
      setCancelOpen(true);
    } else {
      navigate('/products');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <Skeleton className="h-7 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-6 pb-24">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={handleCancel}
            type="button"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-xl font-semibold">
            {isEdit ? '编辑产品' : '新建产品'}
          </h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <TabsList className="w-full justify-start bg-transparent h-auto p-0 border-b border-border rounded-none gap-6">
                <TabsTrigger
                  value="basic"
                  className="relative rounded-none border-0 px-0 pb-3 pt-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent h-auto"
                >
                  基本信息
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="relative rounded-none border-0 px-0 pb-3 pt-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent h-auto"
                >
                  详细参数
                </TabsTrigger>
                <TabsTrigger
                  value="images"
                  className="relative rounded-none border-0 px-0 pb-3 pt-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent h-auto"
                >
                  图片管理
                </TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>

          {/* Tab 1: Basic Info */}
          <TabsContent value="basic">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>产品名称 <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="请输入产品名称" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="product-slug"
                          {...field}
                          onChange={handleSlugChange}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        URL 友好的唯一标识，自动从名称生成，可手动编辑
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-wrap gap-4">
                  <FormField
                    control={form.control}
                    name="itemNumber"
                    render={({ field }) => (
                      <FormItem className="flex-1 min-w-[200px]">
                        <FormLabel>货号</FormLabel>
                        <FormControl>
                          <Input placeholder="产品货号" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem className="flex-1 min-w-[200px]">
                        <FormLabel>分类</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择分类" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat: Category) => (
                              <SelectItem key={cat.id} value={cat.slug}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>产品描述</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="请输入产品描述"
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-wrap gap-8 pt-2">
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-3 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="mb-0">设为精选</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customizationAvailable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-3 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="mb-0">支持定制</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Details */}
          <TabsContent value="details">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">详细参数</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-4">
                  <FormField
                    control={form.control}
                    name="moq"
                    render={({ field }) => (
                      <FormItem className="flex-1 min-w-[150px]">
                        <FormLabel>MOQ</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priceRange"
                    render={({ field }) => (
                      <FormItem className="flex-1 min-w-[150px]">
                        <FormLabel>价格区间</FormLabel>
                        <FormControl>
                          <Input placeholder="如 $1.5-$3.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="leadTime"
                    render={({ field }) => (
                      <FormItem className="flex-1 min-w-[150px]">
                        <FormLabel>交期</FormLabel>
                        <FormControl>
                          <Input placeholder="如 25-30 天" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ageGroup"
                    render={({ field }) => (
                      <FormItem className="flex-1 min-w-[150px]">
                        <FormLabel>年龄分组</FormLabel>
                        <FormControl>
                          <Input placeholder="如 3-6 岁" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="packagingInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>包装信息</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="包装方式、尺寸、重量等"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Features list */}
                <div>
                  <FormLabel className="mb-2 block">特性列表</FormLabel>
                  <div className="space-y-2">
                    {features.length === 0 ? (
                      <p className="text-sm text-muted-foreground mb-2">
                        暂无特性，点击下方按钮添加
                      </p>
                    ) : (
                      features.map((feat: string, index: number) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={feat}
                            onChange={(e) => updateFeature(index, e.target.value)}
                            placeholder={`特性 ${index + 1}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-9 shrink-0 text-destructive hover:text-destructive"
                            onClick={() => removeFeature(index)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addFeature}
                      className="mt-1"
                    >
                      <Plus className="mr-1.5 size-4" />
                      添加特性
                    </Button>
                  </div>
                </div>

                {/* Specifications */}
                <div>
                  <FormLabel className="mb-2 block">规格参数</FormLabel>
                  {specKeys.length === 0 ? (
                    <p className="text-sm text-muted-foreground mb-2">
                      暂无规格，点击下方按钮添加
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {specKeys.map((key: string, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <Input
                            value={key}
                            onChange={(e) => updateSpecKey(key, e.target.value)}
                            placeholder="参数名称"
                            className="flex-1"
                          />
                          <Input
                            value={specifications[key]}
                            onChange={(e) => updateSpecValue(key, e.target.value)}
                            placeholder="参数值"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-9 shrink-0 text-destructive hover:text-destructive"
                            onClick={() => removeSpecification(key)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSpecification}
                    className="mt-2"
                  >
                    <Plus className="mr-1.5 size-4" />
                    添加规格
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Images */}
          <TabsContent value="images">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">主图</CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  ref={mainImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageUpload}
                  className="hidden"
                />
                {imageUrl ? (
                  <div className="relative inline-block">
                    <Image
                      src={imageUrl}
                      alt="主图预览"
                      width={200}
                      height={200}
                      className="w-[200px] h-[200px] rounded-md object-cover border border-border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 size-7 rounded-full"
                      onClick={removeMainImage}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : imageUploading ? (
                  <div className="w-[200px] h-[200px] rounded-md border border-border border-dashed flex items-center justify-center">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => mainImageInputRef.current?.click()}
                    className="w-[200px] h-[200px] rounded-md border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                  >
                    <ImageIcon className="size-8" />
                    <span className="text-sm">点击上传主图</span>
                  </button>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm mt-6">
              <CardHeader>
                <CardTitle className="text-base font-semibold">画廊图片</CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {gallery.map((url: string, index: number) => (
                    <div key={index} className="relative group">
                      <Image
                        src={url}
                        alt={`画廊图片 ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-md object-cover border border-border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 size-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeGalleryImage(index)}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                  {galleryUploading && (
                    <div className="w-20 h-20 rounded-md border border-border border-dashed flex items-center justify-center">
                      <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-20 h-20 rounded-md border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary"
                  >
                    <Upload className="size-5" />
                    <span className="text-xs">添加</span>
                  </button>
                </div>
                {gallery.length === 0 && !galleryUploading && (
                  <p className="text-sm text-muted-foreground mt-3">
                    暂无画廊图片，点击上方按钮添加
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom action bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card px-6 py-3 shadow-[0_-2px_8px_rgba(0_0_0_0.04)]">
          <div className="max-w-[1400px] mx-auto flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveAndContinue}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存并继续编辑'
              )}
            </Button>
            <Button
              type="button"
              onClick={handleSaveAndReturn}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存并返回'
              )}
            </Button>
          </div>
        </div>

        {/* Cancel confirm */}
        <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>离开页面？</AlertDialogTitle>
              <AlertDialogDescription>
                您有未保存的更改，确定要离开吗？未保存的内容将丢失。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>继续编辑</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={() => navigate('/products')}
              >
                离开
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </Form>
  );
};

export default ProductFormPage;
