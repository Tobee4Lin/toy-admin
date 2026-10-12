import { User } from 'lucide-react';
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
          管理账号信息
        </p>
      </div>

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
    </div>
  );
};

export default SettingsPage;
