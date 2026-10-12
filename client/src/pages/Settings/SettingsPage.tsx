import { User, Shield, Code } from 'lucide-react';
import { useCurrentAdmin } from '@/utils/auth';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const SettingsPage = () => {
  const { data: userInfo, isLoading } = useCurrentAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">系统设置</h1>
        <p className="text-sm text-muted-foreground mt-1">
          管理账号信息与 API 对接
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
            如需修改用户名和密码，请联系管理员在服务器上执行更新命令。
          </div>
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
            前台网站提交询盘使用以下公开接口
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
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
