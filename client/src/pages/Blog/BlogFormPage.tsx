import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Upload,
  User,
  Calendar,
  Clock,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { uploadFile } from '@/utils/upload';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Image from '@/components/ui/image';
import { blogPostsApi } from '@/api/index';
import type { BlogPost } from '@shared/api.interface';

const BlogFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [author, setAuthor] = useState('');
  const [authorAvatar, setAuthorAvatar] = useState('');
  const [date, setDate] = useState('');
  const [readingTime, setReadingTime] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [content, setContent] = useState<string[]>(['']);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // 自动从标题生成 slug
  const hasUserEditedSlug = useRef(false);
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    if (!hasUserEditedSlug.current) {
      const generated = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    hasUserEditedSlug.current = true;
    setSlug(e.target.value);
  };

  // 加载编辑数据
  useEffect(() => {
    if (!id) return;
    const loadPost = async () => {
      setLoading(true);
      try {
        const post: BlogPost = await blogPostsApi.getBlogPost(id);
        setTitle(post.title);
        setSlug(post.slug);
        hasUserEditedSlug.current = true;
        setExcerpt(post.excerpt);
        setCategory(post.category);
        setAuthor(post.author);
        setAuthorAvatar(post.authorAvatar);
        setDate(post.date);
        setReadingTime(post.readingTime);
        setCoverImage(post.coverImage);
        setContent(
          post.content && post.content.length > 0 ? post.content : ['']
        );
      } catch (err: unknown) {
        logger.error('加载文章失败', err);
        toast.error('加载文章失败');
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [id]);

  // 段落操作
  const addParagraph = () => {
    setContent([...content, '']);
  };

  const updateParagraph = (index: number, value: string) => {
    const newContent = [...content];
    newContent[index] = value;
    setContent(newContent);
  };

  const removeParagraph = (index: number) => {
    if (content.length <= 1) {
      setContent(['']);
      return;
    }
    setContent(content.filter((_, i: number) => i !== index));
  };

  const moveParagraph = (index: number, direction: 'up' | 'down') => {
    const newContent = [...content];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newContent.length) return;
    [newContent[index], newContent[targetIndex]] = [
      newContent[targetIndex],
      newContent[index],
    ];
    setContent(newContent);
  };

  // 图片上传
  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { url } = await uploadFile(file);
      setAuthorAvatar(url);
      toast.success('头像上传成功');
    } catch (err: unknown) {
      logger.error('头像上传失败', err);
      toast.error('头像上传失败');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleCoverUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const { url } = await uploadFile(file);
      setCoverImage(url);
      toast.success('封面图上传成功');
    } catch (err: unknown) {
      logger.error('封面图上传失败', err);
      toast.error('封面图上传失败');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  // 收集表单数据
  const collectData = (): Partial<BlogPost> & { title: string; slug: string } => {
    return {
      title,
      slug,
      excerpt,
      category,
      author,
      authorAvatar,
      date,
      readingTime,
      coverImage,
      content: content.filter((p: string) => p.trim() !== ''),
    };
  };

  const validate = (): boolean => {
    if (!title.trim()) {
      toast.error('请填写标题');
      return false;
    }
    if (!slug.trim()) {
      toast.error('请填写 Slug');
      return false;
    }
    return true;
  };

  const handleSaveAndReturn = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit && id) {
        await blogPostsApi.updateBlogPost(id, collectData());
      } else {
        await blogPostsApi.createBlogPost(collectData());
      }
      toast.success(isEdit ? '文章更新成功' : '文章创建成功');
      navigate('/blog');
    } catch (err: unknown) {
      logger.error('保存文章失败', err);
      toast.error('保存文章失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      let savedId = id;
      if (isEdit && id) {
        await blogPostsApi.updateBlogPost(id, collectData());
      } else {
        const created = await blogPostsApi.createBlogPost(collectData());
        savedId = created.id;
        // 新建后切换到编辑模式
        navigate(`/blog/${savedId}/edit`, { replace: true });
      }
      toast.success('保存成功');
    } catch (err: unknown) {
      logger.error('保存文章失败', err);
      toast.error('保存文章失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-9 w-48">
          <div className="h-full w-full bg-accent animate-pulse rounded-md" />
        </div>
        <div className="h-64 bg-accent/50 animate-pulse rounded-md" />
        <div className="h-64 bg-accent/50 animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/blog')}
            title="返回"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {isEdit ? '编辑文章' : '新建文章'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              填写文章信息并添加内容段落
            </p>
          </div>
        </div>
      </div>

      {/* 基础信息区 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">基础信息</CardTitle>
          <CardDescription>文章的标题、分类、作者等基本信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">标题 <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                value={title}
                onChange={handleTitleChange}
                placeholder="请输入文章标题"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={handleSlugChange}
                placeholder="文章 URL 标识，自动从标题生成"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">摘要</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="文章简短摘要，用于列表页展示"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="category">分类</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="如：行业资讯"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author" className="flex items-center gap-1">
                <User className="size-3.5 text-muted-foreground" />
                作者
              </Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="作者姓名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reading-time" className="flex items-center gap-1">
                <Clock className="size-3.5 text-muted-foreground" />
                阅读时间
              </Label>
              <Input
                id="reading-time"
                value={readingTime}
                onChange={(e) => setReadingTime(e.target.value)}
                placeholder="如：5 分钟"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-1">
                <Calendar className="size-3.5 text-muted-foreground" />
                发布日期
              </Label>
              <Input
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="如：2025-08-19"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 图片上传区 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">图片设置</CardTitle>
          <CardDescription>作者头像与文章封面图</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* 作者头像 */}
            <div className="space-y-3">
              <Label>作者头像</Label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden border border-border bg-accent flex items-center justify-center shrink-0">
                  {authorAvatar ? (
                    <Image
                      src={authorAvatar}
                      alt="作者头像"
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="size-6 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    <Upload className="size-4" />
                    {uploadingAvatar ? '上传中...' : '上传头像'}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    建议尺寸 64×64，圆形显示
                  </span>
                </div>
              </div>
            </div>

            {/* 封面图 */}
            <div className="space-y-3">
              <Label>封面图</Label>
              <div className="flex items-center gap-4">
                <div className="h-[120px] w-[200px] rounded-md overflow-hidden border border-border bg-accent flex items-center justify-center shrink-0">
                  {coverImage ? (
                    <Image
                      src={coverImage}
                      alt="封面图"
                      width={200}
                      height={120}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FileText className="size-8 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                  >
                    <Upload className="size-4" />
                    {uploadingCover ? '上传中...' : '上传封面'}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    建议尺寸 200×120
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 段落内容编辑器 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">内容段落</CardTitle>
            <CardDescription>逐段编辑文章正文内容</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={addParagraph}>
            <Plus className="size-4" />
            添加段落
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.map((paragraph: string, index: number) => (
            <div
              key={index}
              className="group rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  段落 {index + 1}
                </span>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveParagraph(index, 'up')}
                    disabled={index === 0}
                    title="上移"
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveParagraph(index, 'down')}
                    disabled={index === content.length - 1}
                    title="下移"
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeParagraph(index)}
                    title="删除"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <Textarea
                value={paragraph}
                onChange={(e) => updateParagraph(index, e.target.value)}
                placeholder="在此输入段落内容..."
                rows={4}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 底部操作栏 */}
      <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-background py-4 border-t border-border -mx-6 px-6 -mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/blog')}
          disabled={saving}
        >
          取消
        </Button>
        <Button
          variant="outline"
          onClick={handleSaveAndContinue}
          disabled={saving}
        >
          {saving ? '保存中...' : '保存并继续编辑'}
        </Button>
        <Button onClick={handleSaveAndReturn} disabled={saving}>
          <Save className="size-4" />
          {saving ? '保存中...' : '保存并返回'}
        </Button>
      </div>
    </div>
  );
};

export default BlogFormPage;
