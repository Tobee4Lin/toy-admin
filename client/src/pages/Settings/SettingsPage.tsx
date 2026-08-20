import { useState } from 'react';
import { Download, Loader2, User, Shield, FileJson, Info, Code } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentAdmin } from '@/utils/auth';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { exportProducts, exportCategories, exportBlog } from '@/api/export';

const SettingsPage = () => {
  const { data: userInfo, isLoading } = useCurrentAdmin();
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBlog, setLoadingBlog] = useState(false);

  const handleExport = async (
    fn: () => Promise<void>,
    setLoading: (v: boolean) => void,
    filename: string,
  ): Promise<void> => {
    setLoading(true);
    try {
      await fn();
      toast.success(`导出成功`, {
        description: `${filename} 已下载到本地`,
      });
    } catch (err) {
      toast.error(`导出失败`, {
        description: err instanceof Error ? err.message : '请稍后重试',
      });
    } finally {
      setLoading(false);
    }
  };



  return (
<>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">系统设置</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理账号信息与数据导出
          </p>
        </div>

        {/* 账号信息卡片 */}
        <Card className="rounded-md shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">账号信息</CardTitle>
            </div>
            <CardDescription>当前登录的管理员账号</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                  <User className="h-6 w-6 text-accent-foreground" />
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-foreground">
                    {userInfo.username ?? '未命名用户'}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    用户 ID: {String(userInfo.id)}
                  </div>

                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 账号安全说明卡片 */}
        <Card className="rounded-md shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">账号安全</CardTitle>
            </div>
            <CardDescription>本地管理员账号安全</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground bg-accent/50 border border-border rounded-md p-4">
              本地管理员账号，密码为 admin/admin123（默认）
            </div>
          </CardContent>
        </Card>

        {/* 数据导出卡片 */}
        <Card className="rounded-md shadow-sm" data-ai-section-type="card-list">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">数据导出</CardTitle>
            </div>
            <CardDescription>
              导出前端网站兼容格式的 JSON 数据文件
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="default"
                onClick={() => handleExport(exportProducts, setLoadingProducts, 'products.json')}
                disabled={loadingProducts}
                data-ai-section-type="button"
              >
                {loadingProducts ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                导出产品数据
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport(exportCategories, setLoadingCategories, 'categories.json')}
                disabled={loadingCategories}
                data-ai-section-type="button"
              >
                {loadingCategories ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                导出分类数据
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport(exportBlog, setLoadingBlog, 'blog.json')}
                disabled={loadingBlog}
                data-ai-section-type="button"
              >
                {loadingBlog ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                导出博客数据
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 导入说明卡片 */}
        <Card className="rounded-md shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">导入前端网站说明</CardTitle>
            </div>
            <CardDescription>
              导出的 JSON 文件字段名与前台网站完全一致，可直接覆盖使用
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-foreground bg-accent/50 border border-border rounded-md p-5 list-decimal list-inside">
               <li className="pl-1">
                 导出的 JSON 文件字段名与前台网站完全一致，可直接覆盖
                 <code className="font-mono text-xs bg-background px-1.5 py-0.5 rounded border border-border">
                   src/data/
                 </code>
                 {' '}目录下的同名文件
               </li>
              <li className="pl-1">
                将文件复制到前端网站项目的{' '}
                <code className="font-mono text-xs bg-background px-1.5 py-0.5 rounded border border-border">
                  src/data/
                </code>{' '}
                目录下
              </li>
              <li className="pl-1">替换同名文件即可完成数据更新</li>
              <li className="pl-1">重新构建前端网站以生效</li>
            </ol>
          </CardContent>
        </Card>

         {/* 前台对接 API 说明 */}
         <Card className="rounded-md shadow-sm">
           <CardHeader className="pb-4">
             <div className="flex items-center gap-2">
               <Code className="h-5 w-5 text-primary" />
               <CardTitle className="text-lg">前台网站 API 对接</CardTitle>
             </div>
             <CardDescription>
               前台网站提交询盘和目录下载使用以下公开接口
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-6">
             <section>
               <h3 className="text-sm font-semibold text-foreground mb-2">
                 询盘提交接口
               </h3>
               <div className="rounded-md border border-border bg-accent/50 p-4 font-mono text-xs space-y-2">
                 <div>
                   <span className="text-primary font-semibold">POST</span>
                   {' '}
                   <code>/api/public/inquiries</code>
                 </div>
                 <div className="text-muted-foreground">
                   提交产品询盘，无需鉴权
                 </div>
                 <div className="pt-2 text-foreground">请求字段：</div>
                 <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
  {`name (string, required) — 客户姓名
  company (string, required) — 公司名称
  country (string, required) — 国家
  email (string, required) — 邮箱
  whatsapp (string, optional)
  estimatedQuantity (string, optional)
  message (string, optional)
  productName (string, optional)
  itemNumber (string, optional)
  category (string, optional)
  pageUrl (string, optional)
  customizationRequirement (string, optional)
  source (string, optional, default 'rfq')
  selectedProducts (array, optional) — [{ itemNumber, name, quantity }]`}
                </pre>
               </div>
             </section>

             <section>
               <h3 className="text-sm font-semibold text-foreground mb-2">
                 目录下载线索接口
               </h3>
               <div className="rounded-md border border-border bg-accent/50 p-4 font-mono text-xs space-y-2">
                 <div>
                   <span className="text-primary font-semibold">POST</span>
                   {' '}
                   <code>/api/public/leads</code>
                 </div>
                 <div className="text-muted-foreground">
                   提交目录下载请求，source 自动标记为 'catalog'
                 </div>
                 <div className="pt-2 text-foreground">请求字段：</div>
                 <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
  {`name (string, required)
  company (string, required)
  country (string, required)
  email (string, required, email format)
  whatsapp (string, optional)
  productInterest (string, optional)
  sourcePage (string, optional)
  category (string, optional)`}
                </pre>
               </div>
             </section>

             <section>
               <h3 className="text-sm font-semibold text-foreground mb-2">
                 响应格式
               </h3>
               <pre className="rounded-md border border-border bg-accent/50 p-4 font-mono text-xs text-foreground whitespace-pre-wrap">
  {`{
    "success": true,
    "message": "Inquiry submitted successfully",
    "inquiryId": "...",
    "downloadUrl": "..."   // 仅目录下载接口返回
  }`}
               </pre>
             </section>

             <section>
               <h3 className="text-sm font-semibold text-foreground mb-2">
                 CORS
               </h3>
               <p className="text-sm text-muted-foreground">
                 接口已开启 CORS，允许任何来源跨域调用（credentials: true）。
                 支持方法：GET, POST, PUT, PATCH, DELETE, OPTIONS
               </p>
             </section>

             <section>
               <h3 className="text-sm font-semibold text-foreground mb-2">
                 环境变量示例 (.env)
               </h3>
               <pre className="rounded-md border border-border bg-accent/50 p-4 font-mono text-xs text-foreground whitespace-pre-wrap">
  {`VITE_API_BASE_URL=https://your-backend-domain.com/api
  VITE_CATALOG_DOWNLOAD_URL=/catalogs/toys-catalog-2026.pdf`}
               </pre>
             </section>
           </CardContent>
         </Card>
      </div>
</>
);
};

export default SettingsPage;
