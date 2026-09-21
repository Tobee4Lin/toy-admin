import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  Download,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileUp,
  Image as ImageIcon,
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
import {
  downloadProductTemplate,
  batchImportProductsJson,
} from '@/api/products';
import { uploadFile } from '@/utils/upload';

interface BatchImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ImportStatus = 'idle' | 'uploading' | 'success' | 'partial';

interface ParsedProduct {
  '产品名称*'?: string;
  '产品名称'?: string;
  '货号(Item No.)'?: string;
  '货号'?: string;
  '分类Slug(beach-toys/bubble-toys/rc-toys/building-blocks)'?: string;
  '分类'?: string;
  '产品描述'?: string;
  '产品特性(用分号;分隔)'?: string;
  'MOQ起订量'?: string | number;
  'MOQ'?: string | number;
  '是否支持定制(是/否)'?: string;
  '是否支持定制'?: string;
  '主图(填写文件名如product.jpg，或完整URL)'?: string;
  '主图URL'?: string;
  '主图'?: string;
  '画廊图片(文件名用分号;分隔，或完整URL)'?: string;
  '画廊图片URL(用分号;分隔)'?: string;
  '画廊图片'?: string;
  '包装信息'?: string;
  '交货周期'?: string;
  '适用年龄'?: string;
  '价格区间'?: string;
  '是否精选(是/否)'?: string;
  '是否精选'?: string;
  [key: string]: unknown;
}

export function BatchImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: BatchImportDialogProps) {
  const [excelFile, setExcelFile] = useState<{ name: string; size: number; buffer: ArrayBuffer } | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState('');
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setExcelFile(null);
    setImageFiles([]);
    setStatus('idle');
    setResult(null);
    setUploadProgress('');
  }, []);

  const handleClose = useCallback(() => {
    if (status === 'uploading') return;
    resetState();
    onOpenChange(false);
  }, [status, onOpenChange, resetState]);

  const handleExcelSelect = useCallback((file: File | null) => {
    if (!file) return;
    const validExtensions = ['.xlsx', '.xls'];
    const isValid = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext),
    );
    if (!isValid) {
      toast.error('请上传 Excel 文件（.xlsx 或 .xls 格式）');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('文件大小不能超过 10MB');
      return;
    }
    setExcelFile(file);
    setStatus('idle');
    setResult(null);
  }, []);

  const handleImagesSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const newFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isValid =
        validTypes.includes(file.type) ||
        validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
      if (isValid && file.size <= 5 * 1024 * 1024) {
        // 检查是否已存在同名文件
        if (!imageFiles.some((f) => f.name === file.name)) {
          newFiles.push(file);
        }
      }
    }
    if (newFiles.length > 0) {
      setImageFiles((prev) => [...prev, ...newFiles]);
      toast.success(`已添加 ${newFiles.length} 张图片`);
    }
    if (newFiles.length < files.length) {
      toast.warning('部分图片格式不支持或超过5MB，已跳过');
    }
  }, [imageFiles]);

  const removeImage = useCallback((index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;

      // 判断是Excel还是图片
      const excelExts = ['.xlsx', '.xls'];
      const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isExcel = excelExts.some((ext) =>
          file.name.toLowerCase().endsWith(ext),
        );
        const isImage = imageExts.some((ext) =>
          file.name.toLowerCase().endsWith(ext),
        );
        if (isExcel && !excelFile) {
          handleExcelSelect(file);
        } else if (isImage) {
          handleImagesSelect([file] as unknown as FileList);
        }
      }
    },
    [excelFile, handleExcelSelect, handleImagesSelect],
  );

  const parseExcel = async (file: File): Promise<ParsedProduct[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    return jsonData as ParsedProduct[];
  };

  const handleImport = async () => {
    if (!excelFile) {
      toast.error('请先选择 Excel 文件');
      return;
    }
    setStatus('uploading');
    setUploadProgress('正在解析 Excel...');

    try {
      // 1. 解析Excel
      const products = await parseExcel(excelFile);
      if (products.length === 0) {
        setStatus('idle');
        toast.error('Excel 中没有有效数据');
        return;
      }

      // 2. 上传所有图片，建立文件名到URL的映射
      const imageUrlMap: Record<string, string> = {};
      if (imageFiles.length > 0) {
        setUploadProgress(`正在上传图片 (0/${imageFiles.length})...`);
        for (let i = 0; i < imageFiles.length; i++) {
          try {
            const res = await uploadFile(imageFiles[i]);
            imageUrlMap[imageFiles[i].name] = res.url;
            setUploadProgress(`正在上传图片 (${i + 1}/${imageFiles.length})...`);
          } catch {
            console.error(`图片上传失败: ${imageFiles[i].name}`);
          }
        }
      }

      // 3. 替换产品数据中的图片文件名为URL
      setUploadProgress('正在处理产品数据...');
      const processedProducts = products.map((product) => {
        const result: Record<string, unknown> = { ...product };

        // 处理主图（支持新旧字段名）
        const mainImageKeys = [
          '主图(填写文件名如product.jpg，或完整URL)',
          '主图URL',
          '主图',
        ];
        for (const key of mainImageKeys) {
          if (product[key] !== undefined) {
            const mainImage = String(product[key] || '').trim();
            if (mainImage && !mainImage.startsWith('http')) {
              const matchedUrl = imageUrlMap[mainImage];
              if (matchedUrl) {
                result[key] = matchedUrl;
              }
            }
            break;
          }
        }

        // 处理画廊图片（支持新旧字段名）
        const galleryKeys = [
          '画廊图片(文件名用分号;分隔，或完整URL)',
          '画廊图片URL(用分号;分隔)',
          '画廊图片',
        ];
        for (const key of galleryKeys) {
          if (product[key] !== undefined) {
            const galleryStr = String(product[key] || '').trim();
            if (galleryStr) {
              const galleryItems = galleryStr
                .split(/[;；]/)
                .map((s) => s.trim())
                .filter(Boolean);
              const processedGallery = galleryItems.map((item) => {
                if (item.startsWith('http')) return item;
                return imageUrlMap[item] || item;
              });
              result[key] = processedGallery.join(';');
            }
            break;
          }
        }

        return result;
      });

      // 4. 批量导入
      setUploadProgress('正在导入产品...');
      const res = await batchImportProductsJson(processedProducts);
      setResult(res);

      if (res.failed === 0) {
        setStatus('success');
        toast.success(`成功导入 ${res.success} 个产品`);
        onSuccess?.();
      } else {
        setStatus('partial');
        toast.warning(`导入完成：成功 ${res.success} 个，失败 ${res.failed} 个`);
        if (res.success > 0) onSuccess?.();
      }
    } catch (err) {
      setStatus('idle');
      setUploadProgress('');
      toast.error('导入失败，请检查文件格式');
      console.error(err);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadProductTemplate();
      toast.success('模板下载成功');
    } catch {
      toast.error('模板下载失败');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="size-5 text-primary" />
            批量导入产品
          </DialogTitle>
          <DialogDescription>
            下载 Excel 模板，填写产品信息。图片可直接上传，Excel 中填写图片文件名即可自动匹配。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 步骤1：下载模板 */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">下载导入模板</p>
                <p className="text-xs text-muted-foreground mb-3">
                  模板包含所有字段说明和示例数据。图片字段填写文件名（如 product.jpg），后续上传图片后自动匹配。
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="gap-1.5"
                >
                  <Download className="size-4" />
                  下载 Excel 模板
                </Button>
              </div>
            </div>
          </div>

          {/* 步骤2：上传Excel和图片 */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                2
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-sm font-medium">上传 Excel 和图片</p>

                {/* Excel上传 */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Excel 文件：</p>
                  {!excelFile ? (
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                        isDragging
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                      onClick={() => excelInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                    >
                      <FileSpreadsheet className="size-6 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs font-medium">点击选择 Excel 或拖拽文件到此处</p>
                      <p className="text-xs text-muted-foreground mt-0.5">支持 .xlsx / .xls 格式</p>
                      <input
                        ref={excelInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={(e) => handleExcelSelect(e.target.files?.[0] || null)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-green-100">
                        <FileSpreadsheet className="size-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{excelFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(excelFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => {
                          setExcelFile(null);
                          setResult(null);
                          setStatus('idle');
                        }}
                        disabled={status === 'uploading'}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* 图片上传 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">
                      产品图片（可选，Excel 中填写文件名自动匹配）：
                    </p>
                    {imageFiles.length > 0 && (
                      <span className="text-xs text-primary font-medium">
                        已选择 {imageFiles.length} 张
                      </span>
                    )}
                  </div>
                  {imageFiles.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 hover:bg-muted/50 transition-colors"
                    >
                      <ImageIcon className="size-6 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs font-medium">点击选择产品图片</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        支持 .jpg / .png / .gif / .webp，单张≤5MB，可多选
                      </p>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleImagesSelect(e.target.files)}
                      />
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {imageFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="relative group aspect-square rounded-md border border-border overflow-hidden bg-muted"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              disabled={status === 'uploading'}
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="aspect-square rounded-md border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Upload className="size-4" />
                        </button>
                      </div>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleImagesSelect(e.target.files)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground h-7"
                        onClick={() => setImageFiles([])}
                        disabled={status === 'uploading'}
                      >
                        <Trash2 className="size-3 mr-1" />
                        清空全部图片
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 上传进度 */}
          {status === 'uploading' && uploadProgress && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span className="text-sm text-primary">{uploadProgress}</span>
            </div>
          )}

          {/* 导入结果 */}
          {result && (
            <div
              className={`rounded-lg border p-4 ${
                status === 'success'
                  ? 'border-green-200 bg-green-50'
                  : 'border-amber-200 bg-amber-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {status === 'success' ? (
                  <CheckCircle2 className="size-5 text-green-600" />
                ) : (
                  <AlertCircle className="size-5 text-amber-600" />
                )}
                <span className="font-medium text-sm">
                  {status === 'success'
                    ? '全部导入成功'
                    : `部分导入成功（成功 ${result.success}，失败 ${result.failed}）`}
                </span>
              </div>
              {result.errors.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.map((err, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <span className="shrink-0 font-medium text-amber-700">
                        第 {err.row} 行：
                      </span>
                      <span>{err.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={status === 'uploading'}>
            {result ? '关闭' : '取消'}
          </Button>
          {!result && (
            <Button
              onClick={handleImport}
              disabled={!excelFile || status === 'uploading'}
              className="gap-1.5"
            >
              {status === 'uploading' ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  导入中...
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  开始导入
                </>
              )}
            </Button>
          )}
          {result && (
            <Button
              onClick={() => {
                resetState();
              }}
            >
              继续导入
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
