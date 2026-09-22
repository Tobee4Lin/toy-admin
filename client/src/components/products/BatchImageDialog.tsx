import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  ImagePlus,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Images,
  Upload,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { listProducts, batchAssignImages } from '@/api/products';
import { uploadFile } from '@/utils/upload';
import type { Product } from '@shared/api.interface';

interface BatchImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type MatchRole = 'main' | 'gallery';

interface MatchedFile {
  file: File;
  productId: string;
  itemNumber: string;
  productName: string;
  role: MatchRole;
  index: number;
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_SIZE = 10 * 1024 * 1024;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function BatchImageDialog({
  open,
  onOpenChange,
  onSuccess,
}: BatchImageDialogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [append, setAppend] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<{
    updated: number;
    unmatched: string[];
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 打开弹窗时拉取全量产品
  useEffect(() => {
    if (!open) return;
    setLoadingProducts(true);
    listProducts({ pageSize: 500 })
      .then((res) => setProducts(res.items))
      .catch(() => {
        toast.error('获取产品列表失败');
        setProducts([]);
      })
      .finally(() => setLoadingProducts(false));
  }, [open]);

  const resetState = useCallback(() => {
    setImageFiles([]);
    setAppend(false);
    setResult(null);
    setProgress('');
  }, []);

  const handleClose = useCallback(() => {
    if (running) return;
    resetState();
    onOpenChange(false);
  }, [running, onOpenChange, resetState]);

  const handleSelect = useCallback(
    (files: FileList | File[] | null) => {
      if (!files) return;
      const next: File[] = [];
      let skipped = 0;
      Array.from(files).forEach((file) => {
        const lower = file.name.toLowerCase();
        const valid = IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
        if (!valid || file.size > MAX_SIZE) {
          skipped++;
          return;
        }
        if (!imageFiles.some((f) => f.name === file.name) &&
            !next.some((f) => f.name === file.name)) {
          next.push(file);
        }
      });
      if (next.length > 0) {
        setImageFiles((prev) => [...prev, ...next]);
        setResult(null);
      }
      if (skipped > 0) toast.warning(`${skipped} 个文件格式不支持或超过 10MB，已跳过`);
    },
    [imageFiles],
  );

  const removeFile = useCallback((index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 文件名 -> 产品匹配（仅按文件名解析，未上传也能预览）
  const matchResult = useMemo(() => {
    const byItem = new Map<string, Product>();
    products.forEach((p) => {
      if (p.itemNumber && p.itemNumber.trim()) {
        byItem.set(p.itemNumber.trim().toLowerCase(), p);
      }
    });
    // 货号长的优先匹配，避免短货号前缀误伤
    const itemKeys = Array.from(byItem.keys()).sort((a, b) => b.length - a.length);

    const matched: MatchedFile[] = [];
    const unmatched: File[] = [];

    for (const file of imageFiles) {
      const extIdx = file.name.lastIndexOf('.');
      const base = (extIdx > 0 ? file.name.slice(0, extIdx) : file.name).trim();
      const lower = base.toLowerCase();

      // 1) 精确等于货号 -> 主图
      const exact = byItem.get(lower);
      if (exact) {
        matched.push({
          file,
          productId: exact.id,
          itemNumber: exact.itemNumber,
          productName: exact.name,
          role: 'main',
          index: 0,
        });
        continue;
      }

      // 2) 货号 + 分隔符(-/_/空格) + 数字 -> 画廊图
      let galleryHit: { product: Product; index: number } | null = null;
      for (const key of itemKeys) {
        const re = new RegExp(`^${escapeRegExp(key)}[-_\\s](\\d+)$`);
        const m = lower.match(re);
        if (m) {
          galleryHit = { product: byItem.get(key)!, index: parseInt(m[1], 10) };
          break;
        }
      }
      if (galleryHit) {
        matched.push({
          file,
          productId: galleryHit.product.id,
          itemNumber: galleryHit.product.itemNumber,
          productName: galleryHit.product.name,
          role: 'gallery',
          index: galleryHit.index,
        });
      } else {
        unmatched.push(file);
      }
    }

    // 按产品聚合
    const grouped = new Map<
      string,
      {
        product: Product;
        main: MatchedFile | null;
        gallery: MatchedFile[];
      }
    >();

    const productById = new Map(products.map((p) => [p.id, p]));
    for (const m of matched) {
      const p = productById.get(m.productId);
      if (!p) continue;
      if (!grouped.has(m.productId)) {
        grouped.set(m.productId, { product: p, main: null, gallery: [] });
      }
      const group = grouped.get(m.productId)!;
      if (m.role === 'main') {
        group.main = m;
      } else {
        group.gallery.push(m);
      }
    }

    grouped.forEach((group) => group.gallery.sort((a, b) => a.index - b.index));

    return { matched, unmatched, grouped };
  }, [imageFiles, products]);

  const handleSubmit = async () => {
    if (imageFiles.length === 0) {
      toast.error('请先选择图片');
      return;
    }
    if (matchResult.matched.length === 0) {
      toast.error('没有可匹配到产品的图片，请检查文件命名');
      return;
    }

    setRunning(true);
    setResult(null);
    try {
      // 1. 上传所有图片，建立 文件名 -> URL
      const urlByName = new Map<string, string>();
      const allFiles = imageFiles;
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        setProgress(`正在上传图片 (${i + 1}/${allFiles.length})：${file.name}`);
        try {
          const res = await uploadFile(file);
          urlByName.set(file.name, res.url);
        } catch {
          console.error(`图片上传失败: ${file.name}`);
        }
      }

      // 2. 组装 assignments
      setProgress('正在匹配产品...');
      const assignments: Array<{
        id: number;
        mainImage?: string | null;
        gallery?: string[];
      }> = [];
      const unmatchedNames: string[] = [];

      for (const { product, main, gallery } of matchResult.grouped.values()) {
        const sortedGallery = gallery
          .map((g) => ({ index: g.index, url: urlByName.get(g.file.name) }))
          .filter((g): g is { index: number; url: string } => !!g.url);
        const mainUrl = main ? urlByName.get(main.file.name) : undefined;
        const fallbackMain = !mainUrl && sortedGallery.length > 0 ? sortedGallery[0].url : null;
        assignments.push({
          id: Number(product.id),
          mainImage: mainUrl ?? fallbackMain ?? null,
          gallery: sortedGallery.map((g) => g.url),
        });
      }
      for (const file of matchResult.unmatched) {
        unmatchedNames.push(file.name);
      }

      // 3. 调后端批量分配
      setProgress('正在写入产品...');
      const res = await batchAssignImages({
        mode: append ? 'append' : 'replace',
        assignments,
      });

      setResult({ updated: res.updated, unmatched: unmatchedNames });
      toast.success(`成功为 ${res.updated} 个产品分配图片`);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error('批量传图失败');
    } finally {
      setRunning(false);
      setProgress('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImagePlus className="size-5 text-primary" />
            批量上传产品图片
          </DialogTitle>
          <DialogDescription>
            产品信息已通过 Excel 导入后，可在这里按<b>货号</b>分批补传图片。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 命名规则 */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 p-4 text-xs">
            <p className="font-medium text-sm mb-2 flex items-center gap-1.5">
              <Images className="size-4" />
              图片命名规则（以货号命名）
            </p>
            <ul className="space-y-1 text-muted-foreground list-disc pl-5">
              <li>
                主图：<code className="px-1 bg-background rounded">{'{货号}.jpg'}</code>，例如{' '}
                <code className="px-1 bg-background rounded">LCBUB888001.jpg</code>
              </li>
              <li>
                画廊图：<code className="px-1 bg-background rounded">{'{货号}-1.jpg'}</code>、
                <code className="px-1 bg-background rounded">{'{货号}-2.jpg'}</code>
                （分隔符支持 - 或 _），按编号排序
              </li>
              <li>未提供主图时，编号最小的一张画廊图会自动作为主图</li>
              <li>文件名无法匹配到货号的图片会被跳过并列在报告中</li>
            </ul>
          </div>

          {/* 选择图片 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">
                选择图片
                <span className="ml-2 text-xs text-muted-foreground">
                  支持 .jpg / .jpeg / .png / .gif / .webp，单张 ≤ 10MB
                </span>
              </p>
              {imageFiles.length > 0 && (
                <span className="text-xs text-primary font-medium">
                  已选 {imageFiles.length} 张
                </span>
              )}
            </div>

            {imageFiles.length === 0 ? (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleSelect(e.dataTransfer.files);
                }}
              >
                <ImagePlus className="size-7 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm font-medium">点击选择图片或拖拽到此处</p>
                <p className="text-xs text-muted-foreground mt-0.5">可一次多选</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleSelect(e.target.files)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                  {imageFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="relative group aspect-square rounded-md border border-border overflow-hidden bg-muted"
                      title={file.name}
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={running}
                        className="absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="aspect-square rounded-md border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Upload className="size-4" />
                  </button>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleSelect(e.target.files)}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={append}
                      onChange={(e) => setAppend(e.target.checked)}
                      className="size-3.5 accent-[hsl(192_95%30%)]"
                    />
                    追加到已有图片（默认覆盖该产品现有图片）
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground h-7"
                    onClick={() => setImageFiles([])}
                    disabled={running}
                  >
                    <Trash2 className="size-3 mr-1" />
                    清空
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 匹配预览 */}
          {imageFiles.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              {loadingProducts ? (
                <p className="text-xs text-muted-foreground">正在加载产品列表...</p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">匹配预览</p>
                    <p className="text-xs text-muted-foreground">
                      命中 {matchResult.grouped.size} 个产品 ·{' '}
                      <span className="text-green-600">{matchResult.matched.length} 张匹配</span>
                      {matchResult.unmatched.length > 0 && (
                        <>
                          {' · '}
                          <span className="text-amber-600">
                            {matchResult.unmatched.length} 张未匹配
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="max-h-44 overflow-y-auto space-y-1.5">
                    {Array.from(matchResult.grouped.values()).map(({ product, main, gallery }) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs"
                      >
                        <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                        <span className="font-medium shrink-0">{product.itemNumber || '—'}</span>
                        <span className="truncate text-muted-foreground flex-1">
                          {product.name}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {main ? '主图 1' : '主图自动'} · 画廊 {gallery.length}
                        </span>
                      </div>
                    ))}
                    {matchResult.unmatched.map((file, i) => (
                      <div
                        key={`un-${i}`}
                        className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1.5 text-xs"
                      >
                        <AlertCircle className="size-4 text-amber-600 shrink-0" />
                        <span className="truncate">{file.name}</span>
                        <span className="shrink-0 text-amber-700">未匹配，将跳过</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 上传进度 */}
          {running && progress && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span className="text-sm text-primary">{progress}</span>
            </div>
          )}

          {/* 结果 */}
          {result && (
            <div
              className={`rounded-lg border p-4 ${
                result.unmatched.length === 0
                  ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
                  : 'border-amber-200 bg-amber-50 dark:bg-amber-950/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {result.unmatched.length === 0 ? (
                  <CheckCircle2 className="size-5 text-green-600" />
                ) : (
                  <AlertCircle className="size-5 text-amber-600" />
                )}
                <span className="font-medium text-sm">
                  已为 {result.updated} 个产品分配图片
                </span>
              </div>
              {result.unmatched.length > 0 && (
                <div className="max-h-32 overflow-y-auto">
                  <p className="text-xs text-amber-700 mb-1">以下图片未匹配到产品（已跳过）：</p>
                  {result.unmatched.map((name, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      · {name}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={running}>
            {result ? '关闭' : '取消'}
          </Button>
          {!result && (
            <Button
              onClick={handleSubmit}
              disabled={imageFiles.length === 0 || running || loadingProducts}
              className="gap-1.5"
            >
              {running ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <ImagePlus className="size-4" />
                  开始上传并匹配
                </>
              )}
            </Button>
          )}
          {result && (
            <Button onClick={resetState}>继续传图</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
