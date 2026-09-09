import { useState, useEffect, useCallback } from 'react';
import {
  Video, Plus, Play, RefreshCw, Trash2, Download, Clock,
  CheckCircle2, XCircle, Loader2, Film, Music, Subtitles,
  Globe, Sparkles, ChevronDown, ChevronUp, Copy, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  getVideoTasks, createVideoTask, refreshVideoTask, deleteVideoTask, checkMptService,
  type VideoTask, type VideoTaskStatus, type AspectRatio,
} from '@/api/video-marketing';

const SUBJECT_TEMPLATES = [
  'Amazing bubble toys for kids - fun outdoor play',
  'Remote control car collection - high speed RC toys',
  'Building blocks educational toys - creative play',
  'Beach sand toys set - summer fun for children',
  'Best plastic toys wholesale from China',
  'New arrival educational STEM toys for kids',
];

const VOICE_OPTIONS = [
  { provider: 'edge', name: 'en-US-AriaNeural', label: 'English - Aria (Female)' },
  { provider: 'edge', name: 'en-US-GuyNeural', label: 'English - Guy (Male)' },
  { provider: 'edge', name: 'en-US-JennyNeural', label: 'English - Jenny (Female)' },
  { provider: 'edge', name: 'es-ES-ElviraNeural', label: 'Spanish - Elvira (Female)' },
  { provider: 'edge', name: 'fr-FR-DeniseNeural', label: 'French - Denise (Female)' },
  { provider: 'edge', name: 'de-DE-KatjaNeural', label: 'German - Katja (Female)' },
  { provider: 'edge', name: 'ja-JP-NanamiNeural', label: 'Japanese - Nanami (Female)' },
  { provider: 'edge', name: 'ar-SA-ZariyahNeural', label: 'Arabic - Zariyah (Female)' },
];

const STATUS_CONFIG: Record<VideoTaskStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: '等待中', color: 'bg-gray-100 text-gray-600', icon: Clock },
  generating: { label: '生成中', color: 'bg-blue-100 text-blue-600', icon: Loader2 },
  completed: { label: '已完成', color: 'bg-green-100 text-green-600', icon: CheckCircle2 },
  failed: { label: '失败', color: 'bg-red-100 text-red-600', icon: XCircle },
  cancelled: { label: '已取消', color: 'bg-orange-100 text-orange-600', icon: XCircle },
};

export default function VideoMarketingPage() {
  const [tasks, setTasks] = useState<VideoTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [serviceAvailable, setServiceAvailable] = useState<boolean | null>(null);
  const [serviceUrl, setServiceUrl] = useState('');
  const [expandedLogs, setExpandedLogs] = useState<number | null>(null);

  // 表单状态
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formScript, setFormScript] = useState('');
  const [formAspect, setFormAspect] = useState<AspectRatio>('9:16');
  const [formVoice, setFormVoice] = useState('en-US-AriaNeural');
  const [formSubtitle, setFormSubtitle] = useState(true);
  const [formBgm, setFormBgm] = useState(true);
  const [formVideoCount, setFormVideoCount] = useState(1);
  const [formParagraph, setFormParagraph] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const data = await getVideoTasks();
      setTasks(data);
    } catch (err) {
      toast.error('加载失败', { description: err instanceof Error ? err.message : '请稍后重试' });
    } finally {
      setLoading(false);
    }
  }, []);

  const checkService = useCallback(async () => {
    try {
      const status = await checkMptService();
      setServiceAvailable(status.available);
      setServiceUrl(status.baseUrl);
    } catch {
      setServiceAvailable(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    checkService();
  }, [loadTasks, checkService]);

  // 轮询生成中的任务
  useEffect(() => {
    const generating = tasks.filter((t) => t.status === 'generating' || t.status === 'pending');
    if (generating.length === 0) return;
    const timer = setInterval(() => {
      generating.forEach(async (t) => {
        try {
          const updated = await refreshVideoTask(t.id);
          setTasks((prev) => prev.map((p) => (p.id === t.id ? updated : p)));
        } catch { /* ignore */ }
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [tasks]);

  const handleCreate = async () => {
    if (!formTitle.trim() || !formSubject.trim()) {
      toast.error('请填写标题和主题');
      return;
    }
    setSubmitting(true);
    try {
      const voiceOpt = VOICE_OPTIONS.find((v) => v.name === formVoice);
      await createVideoTask({
        title: formTitle,
        subject: formSubject,
        videoScript: formScript || undefined,
        aspectRatio: formAspect,
        voiceProvider: voiceOpt?.provider || 'edge',
        voiceName: voiceOpt?.name,
        voiceLanguage: voiceOpt?.name?.split('-').slice(0, 2).join('-') || 'en-US',
        subtitleEnabled: formSubtitle,
        bgmEnabled: formBgm,
        videoCount: formVideoCount,
        paragraphCount: formParagraph,
      });
      toast.success('任务已创建', { description: '视频生成中，请稍候...' });
      setCreateOpen(false);
      resetForm();
      loadTasks();
    } catch (err) {
      toast.error('创建失败', { description: err instanceof Error ? err.message : '请稍后重试' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormSubject('');
    setFormScript('');
    setFormAspect('9:16');
    setFormVoice('en-US-AriaNeural');
    setFormSubtitle(true);
    setFormBgm(true);
    setFormVideoCount(1);
    setFormParagraph(3);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此视频任务？')) return;
    try {
      await deleteVideoTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success('已删除');
    } catch (err) {
      toast.error('删除失败', { description: err instanceof Error ? err.message : '' });
    }
  };

  const handleRefresh = async (id: number) => {
    try {
      const updated = await refreshVideoTask(id);
      setTasks((prev) => prev.map((p) => (p.id === id ? updated : p)));
      if (!updated.mptTaskId && (updated.status === 'failed' || updated.status === 'pending')) {
        toast.info('已重新提交生成任务', { description: '请确保 MPT 服务已启动' });
      } else {
        toast.success('已刷新');
      }
    } catch (err) {
      toast.error('刷新失败', { description: err instanceof Error ? err.message : '' });
    }
  };

  const formatDuration = (sec: number | null) => {
    if (!sec) return '-';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Film className="h-6 w-6 text-primary" />
            短视频营销
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI 自动生成产品营销短视频，支持 TikTok / Instagram / YouTube Shorts
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* 服务状态 */}
          <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${
            serviceAvailable === null ? 'bg-gray-100 text-gray-500' :
            serviceAvailable ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              serviceAvailable === null ? 'bg-gray-400' :
              serviceAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`} />
            {serviceAvailable === null ? '检测中...' : serviceAvailable ? 'MPT 服务已连接' : 'MPT 服务未连接'}
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            创建视频
          </Button>
        </div>
      </div>

      {/* 服务未连接提示 */}
      {serviceAvailable === false && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="text-amber-600 mt-0.5"><Sparkles className="h-5 w-5" /></div>
              <div className="text-sm text-amber-800">
                <p className="font-medium">MoneyPrinterTurbo 服务未启动</p>
                <p className="mt-1 text-amber-700">
                  请先启动 MPT API 服务：在 MoneyPrinterTurbo 项目目录运行 <code className="bg-amber-100 px-1.5 py-0.5 rounded">python main.py</code>
                  ，默认地址 <code className="bg-amber-100 px-1.5 py-0.5 rounded">{serviceUrl || 'http://127.0.0.1:8080'}</code>
                </p>
                <p className="mt-1 text-amber-700">
                  可通过环境变量 <code className="bg-amber-100 px-1.5 py-0.5 rounded">MPT_API_URL</code> 配置自定义地址
                </p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" onClick={checkService}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />重新检测
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold">{tasks.length}</div>
            <div className="text-xs text-muted-foreground mt-1">总任务数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-blue-600">
              {tasks.filter((t) => t.status === 'generating' || t.status === 'pending').length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">生成中</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter((t) => t.status === 'completed').length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">已完成</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-red-600">
              {tasks.filter((t) => t.status === 'failed').length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">失败</div>
          </CardContent>
        </Card>
      </div>

      {/* 任务列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">视频任务列表</CardTitle>
          <CardDescription>所有 AI 视频生成任务</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">加载中...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-16">
              <Video className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground">暂无视频任务</p>
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />创建第一个视频
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const statusCfg = STATUS_CONFIG[task.status];
                const StatusIcon = statusCfg.icon;
                return (
                  <div key={task.id} className="border rounded-lg p-4 hover:border-primary/30 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* 视频预览/封面 */}
                      <div className="w-40 h-24 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {task.videoUrl ? (
                          <video
                            src={task.videoUrl}
                            className="w-full h-full object-cover"
                            controls
                            preload="metadata"
                          />
                        ) : task.coverUrl ? (
                          <img src={task.coverUrl} alt={task.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <Video className="h-6 w-6 mx-auto text-gray-400" />
                            <span className="text-xs text-gray-400 mt-1 block">{task.aspectRatio}</span>
                          </div>
                        )}
                      </div>

                      {/* 信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{task.title}</h3>
                          <Badge className={statusCfg.color} variant="secondary">
                            <StatusIcon className={`h-3 w-3 mr-1 ${task.status === 'generating' ? 'animate-spin' : ''}`} />
                            {statusCfg.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{task.aspectRatio}</Badge>
                          {task.duration && (
                            <Badge variant="outline" className="text-xs">{formatDuration(task.duration)}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-2">{task.subject}</p>

                        {/* 进度条 */}
                        {(task.status === 'generating' || task.status === 'pending') && (
                          <div className="flex items-center gap-2 mb-2">
                            <Progress value={task.progress} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground w-10">{task.progress}%</span>
                          </div>
                        )}

                        {/* 错误信息 */}
                        {task.status === 'failed' && task.errorMessage && (
                          <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded mb-2">
                            {task.errorMessage}
                          </p>
                        )}

                        {/* 配置标签 */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />{task.voiceLanguage}
                          </span>
                          {task.subtitleEnabled && (
                            <span className="flex items-center gap-1"><Subtitles className="h-3 w-3" />字幕</span>
                          )}
                          {task.bgmEnabled && (
                            <span className="flex items-center gap-1"><Music className="h-3 w-3" />BGM</span>
                          )}
                          <span>{task.videoCount}个视频 / {task.paragraphCount}段</span>
                        </div>
                      </div>

                      {/* 操作 */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {task.videoUrl && (
                          <a href={task.videoUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />打开
                            </Button>
                          </a>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleRefresh(task.id)}>
                          <RefreshCw className="h-3.5 w-3.5 mr-1" />{!task.mptTaskId && (task.status === 'failed' || task.status === 'pending') ? '重试' : '刷新'}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(task.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* 日志展开 */}
                    {task.logs && task.logs.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <button
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                          onClick={() => setExpandedLogs(expandedLogs === task.id ? null : task.id)}
                        >
                          {expandedLogs === task.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          运行日志 ({task.logs.length})
                        </button>
                        {expandedLogs === task.id && (
                          <div className="mt-2 bg-gray-50 rounded p-3 max-h-40 overflow-y-auto text-xs font-mono space-y-1">
                            {task.logs.map((log, i) => (
                              <div key={i} className="text-gray-600">{log}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建视频对话框 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              创建 AI 短视频
            </DialogTitle>
            <DialogDescription>
              输入主题，AI 将自动生成脚本、配音、字幕和视频
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 标题 */}
            <div>
              <Label>任务标题 *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="例如：泡泡玩具产品推广视频"
                className="mt-1.5"
              />
            </div>

            {/* 主题 */}
            <div>
              <Label>视频主题 *</Label>
              <Textarea
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                placeholder="描述视频主题，例如：Amazing bubble toys for kids - fun outdoor play"
                rows={2}
                className="mt-1.5"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SUBJECT_TEMPLATES.map((t) => (
                  <button
                    key={t}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                    onClick={() => setFormSubject(t)}
                  >
                    {t.length > 30 ? t.slice(0, 30) + '...' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* 自定义脚本（可选） */}
            <Accordion type="single" collapsible>
              <AccordionItem value="advanced">
                <AccordionTrigger className="text-sm">高级设置（可选）</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  {/* 自定义脚本 */}
                  <div>
                    <Label>自定义视频脚本</Label>
                    <Textarea
                      value={formScript}
                      onChange={(e) => setFormScript(e.target.value)}
                      placeholder="留空则由 AI 自动生成脚本（需要 LLM API Key）。填写后无需 LLM Key，每行一个段落。"
                      rows={3}
                      className="mt-1.5"
                    />
                    {formScript && (
                      <p className="text-xs text-green-600 mt-1">✓ 已填写自定义脚本，无需配置 LLM API Key</p>
                    )}
                  </div>

                  {/* 画幅 */}
                  <div>
                    <Label>视频画幅</Label>
                    <Select value={formAspect} onValueChange={(v) => setFormAspect(v as AspectRatio)}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9:16">竖屏 9:16（TikTok / Shorts）</SelectItem>
                        <SelectItem value="16:9">横屏 16:9（YouTube）</SelectItem>
                        <SelectItem value="1:1">方形 1:1（Instagram Feed）</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 配音 */}
                  <div>
                    <Label>AI 配音</Label>
                    <Select value={formVoice} onValueChange={setFormVoice}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VOICE_OPTIONS.map((v) => (
                          <SelectItem key={v.name} value={v.name}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 数量 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>生成视频数量</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={formVideoCount}
                        onChange={(e) => setFormVideoCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>脚本段落数</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={formParagraph}
                        onChange={(e) => setFormParagraph(Math.max(1, parseInt(e.target.value) || 1))}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  {/* 开关 */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch id="subtitle" checked={formSubtitle} onCheckedChange={setFormSubtitle} />
                      <Label htmlFor="subtitle" className="cursor-pointer">自动字幕</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="bgm" checked={formBgm} onCheckedChange={setFormBgm} />
                      <Label htmlFor="bgm" className="cursor-pointer">背景音乐</Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
              开始生成
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
