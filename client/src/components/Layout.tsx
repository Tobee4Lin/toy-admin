import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  FileText,
  MessageSquare,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  Search,
  Brain,
  Send,
  Mail,
  MapPin,
  Briefcase,
  Sparkles,
  BarChart3,
  Sun,
  Moon,
  Activity,
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
  useSidebar,
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

interface NavGroup {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    label: '工作台',
    icon: BarChart3,
    items: [
      { path: "/", label: "仪表盘", icon: LayoutDashboard },
      { path: "/analytics", label: "访问统计", icon: Activity },
    ],
  },
  {
    id: 'product',
    label: '产品中心',
    icon: Package,
    items: [
      { path: "/products", label: "产品管理", icon: Package },
      { path: "/categories", label: "分类管理", icon: Tags },
    ],
  },
  {
    id: 'content',
    label: '内容管理',
    icon: FileText,
    items: [
      { path: "/blog", label: "博客管理", icon: FileText },
    ],
  },
  {
    id: 'business',
    label: '业务管理',
    icon: Briefcase,
    items: [
      { path: "/inquiries", label: "询盘管理", icon: MessageSquare },
      { path: "/customers", label: "客户管理", icon: Users },
    ],
  },
  {
    id: 'document',
    label: '单证工具',
    icon: ClipboardList,
    items: [
      { path: "/documents", label: "单证管理", icon: ClipboardList },
    ],
  },
  {
    id: 'ai',
    label: 'AI 获客',
    icon: Sparkles,
    items: [
      { path: "/ai-lead", label: "AI获客", icon: Search },
      { path: "/ai-intelligence", label: "AI背调", icon: Brain },
      { path: "/ai-outreach", label: "AI开发", icon: Send },
      { path: "/email-center", label: "邮箱中心", icon: Mail },
      { path: "/maps-scraper", label: "地图采集", icon: MapPin },
    ],
  },
  {
    id: 'system',
    label: '系统',
    icon: Settings,
    items: [
      { path: "/settings", label: "系统设置", icon: Settings },
    ],
  },
];

// Flatten for title lookup
const ALL_ITEMS: NavItem[] = NAV_GROUPS.flatMap(g => g.items);

function getTitleByPath(pathname: string): string {
  const match = ALL_ITEMS.find((item: NavItem) => {
    if (item.path === "/") return pathname === "/";
    return pathname.startsWith(item.path);
  });
  return match?.label ?? "管理后台";
}

function getGroupByPath(pathname: string): string {
  for (const group of NAV_GROUPS) {
    if (group.items.some(item => item.path === "/" ? pathname === "/" : pathname.startsWith(item.path))) {
      return group.id;
    }
  }
  return '';
}

const NavGroupComponent = ({ group, pathname }: { group: NavGroup; pathname: string }) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const activeGroup = getGroupByPath(pathname);
  const [open, setOpen] = useState(activeGroup === group.id);

  useEffect(() => {
    if (activeGroup === group.id) setOpen(true);
  }, [activeGroup, group.id]);

  const hasActiveChild = group.items.some(item =>
    item.path === "/" ? pathname === "/" : pathname.startsWith(item.path)
  );

  // Single item group: show as direct link
  if (group.items.length === 1) {
    const item = group.items[0];
    const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
    return (
      <SidebarMenuItem key={group.id}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className="h-9 rounded-lg text-[13px] font-medium"
        >
          <Link to={item.path}>
            <item.icon className="size-[18px]" />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // Multi-item group: collapsible accordion
  return (
    <SidebarMenuItem key={group.id}>
      <SidebarMenuButton
        onClick={() => setOpen(!open)}
        className={`h-9 cursor-pointer rounded-lg text-[13px] hover:bg-sidebar-accent/70 ${
          hasActiveChild
            ? "font-semibold text-sidebar-foreground"
            : "font-medium text-sidebar-foreground/75"
        }`}
      >
        <group.icon className={`size-[18px] ${hasActiveChild ? "text-primary" : ""}`} />
        <span className="flex-1 text-left">{group.label}</span>
        {!isCollapsed && (
          <ChevronDown
            className={`size-3.5 text-sidebar-foreground/50 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </SidebarMenuButton>
      {open && !isCollapsed && (
        <div className="relative mt-1 ml-[18px] space-y-0.5 border-l border-sidebar-border/70 pl-2.5 pb-1">
          {group.items.map((item) => {
            const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
            return (
              <SidebarMenuButton
                key={item.path}
                asChild
                isActive={isActive}
                size="sm"
                className={`h-8 rounded-lg text-[12.5px] ${
                  isActive
                    ? "bg-primary/10 font-medium text-primary hover:bg-primary/15 hover:text-primary"
                    : "font-normal text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                }`}
              >
                <Link to={item.path}>
                  <item.icon className="size-3.5" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            );
          })}
        </div>
      )}
    </SidebarMenuItem>
  );
};

const LayoutContent = () => {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);
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
                  <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/75 text-base font-bold text-primary-foreground shadow-sm">
                    T
                  </div>
                  <div className="group-data-[collapsible=icon]:hidden">
                    <div className="text-sm font-semibold tracking-tight">ToyAdmin</div>
                    <div className="text-xs text-sidebar-foreground/55">
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
              <SidebarMenu className="space-y-0.5">
                {NAV_GROUPS.map((group) => (
                  <NavGroupComponent key={group.id} group={group} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu className="space-y-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="h-9 rounded-lg text-[13px] text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
              >
                <button
                  onClick={() => {
                    logout();
                  }}
                >
                  <LogOut className="size-[18px]" />
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
          <button onClick={() => setDark(!dark)} className="ml-auto rounded-md p-2 hover:bg-accent transition-colors" title="切换主题">
            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
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
