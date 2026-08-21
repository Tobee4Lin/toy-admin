import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  FileText,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { logout } from '@/utils/auth';

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "仪表盘", icon: LayoutDashboard },
  { path: "/products", label: "产品管理", icon: Package },
  { path: "/categories", label: "分类管理", icon: Tags },
  { path: "/blog", label: "博客管理", icon: FileText },
  { path: "/inquiries", label: "询盘管理", icon: MessageSquare },
  { path: "/customers", label: "客户管理", icon: Users },
  { path: "/settings", label: "系统设置", icon: Settings },
];

function getTitleByPath(pathname: string): string {
  const match = NAV_ITEMS.find((item: NavItem) => {
    if (item.path === "/") return pathname === "/";
    return pathname.startsWith(item.path);
  });
  return match?.label ?? "管理后台";
}

const LayoutContent = () => {
  const { pathname } = useLocation();
  const activeTitle = getTitleByPath(pathname);

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg">
                <Link to="/">
                  <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
                    T
                  </div>
                  <div className="group-data-[collapsible=icon]:hidden">
                    <div className="text-sm font-semibold">ToyAdmin</div>
                    <div className="text-xs text-sidebar-foreground/60">
                      管理后台
                    </div>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item: NavItem) => {
                  const isActive =
                    item.path === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.path);
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="relative"
                      >
                        <Link to={item.path}>
                          {isActive && (
                            <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary" />
                          )}
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <button
                  onClick={() => {
                    logout();
                  }}
                >
                  <LogOut className="size-4" />
                  <span>退出登录</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <main className="flex flex-1 flex-col overflow-hidden bg-background p-6">
        <header className="mb-6 flex items-center gap-3">
          <SidebarTrigger />
          <ChevronRight className="size-4 text-muted-foreground" />
          <Breadcrumb className="self-center">
            <BreadcrumbList>
              <BreadcrumbItem className="text-foreground font-medium">
                {activeTitle}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </>
  );
};

const Layout = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-svh w-full">
        <LayoutContent />
      </div>
    </SidebarProvider>
  );
};

export default Layout;
