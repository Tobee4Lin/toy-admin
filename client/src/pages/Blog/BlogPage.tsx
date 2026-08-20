import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Calendar,
  User,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
import Image from '@/components/ui/image';
import {
  blogPostsApi,
} from '@/api/index';
import type { BlogPost } from '@shared/api.interface';

const BlogPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params: {
        search?: string;
        category?: string;
        page: number;
        pageSize: number;
      } = { page, pageSize };
      if (search) params.search = search;
      if (category && category !== 'all') params.category = category;
      const res = await blogPostsApi.listBlogPosts(params);
      setPosts(res.items);
      setTotal(res.total);

      // Extract unique categories from all posts for filter
      const cats = new Set<string>();
      res.items.forEach((item: BlogPost) => {
        if (item.category) cats.add(item.category);
      });
      setCategories(Array.from(cats));
    } catch (err: unknown) {
      logger.error('获取博客列表失败', err);
      toast.error('获取博客列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [search, category, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await blogPostsApi.deleteBlogPost(deleteId);
      toast.success('文章删除成功');
      setDeleteId(null);
      fetchPosts();
    } catch (err: unknown) {
      logger.error('删除文章失败', err);
      toast.error('删除文章失败');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-6">
      {/* 顶部操作栏 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">博客管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            共 {total} 篇文章
          </p>
        </div>
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索标题或摘要..."
              className="w-64 pl-9"
            />
          </form>
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="全部分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {categories.map((cat: string) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => navigate('/blog/new')}>
            <Plus className="size-4" />
            新增文章
          </Button>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3].map((i: number) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4"
              >
                <Skeleton className="h-14 w-20 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="size-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">暂无文章</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              点击右上角「新增文章」开始创作
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {posts.map((post: BlogPost) => (
              <div
                key={post.id}
                className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="shrink-0">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      width={80}
                      height={56}
                      className="h-14 w-20 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-14 w-20 rounded-md bg-accent flex items-center justify-center">
                      <FileText className="size-5 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground truncate">
                      {post.title}
                    </h3>
                    {post.category && (
                      <Badge variant="secondary" className="shrink-0">
                        {post.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {post.author && (
                      <span className="flex items-center gap-1">
                        <User className="size-3" />
                        {post.author}
                      </span>
                    )}
                    {post.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {post.date}
                      </span>
                    )}
                    {post.readingTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {post.readingTime}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/blog/${post.id}/edit`)}
                    title="编辑"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(post.id)}
                    title="删除"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除文章？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销，删除后文章将永久丢失。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
            >
              {deleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BlogPage;
