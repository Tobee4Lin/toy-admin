import { useState, useEffect, useRef } from 'react';
import {
  Play, Square, Save, Download, FileSpreadsheet, MapPin, Search,
  Building2, Mail, Phone, Globe, Plus, Trash2, UserPlus, History,
  ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle, Clock,
  Filter, RefreshCw, Zap, Target, TrendingUp, AlertCircle, Copy,
  CheckSquare, Square as SquareIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import * as XLSX from 'xlsx-js-style';
import {
  getTasks, getTask, createTask, startTask, stopTask, deleteTask,
  getResults, addResultToCustomer, deleteResult,
  getPresets, createPreset, deletePreset,
  type MapsScraperTask, type MapsScraperResult, type MapsScraperPreset,
} from '@/api/maps-scraper';

const COUNTRY_OPTIONS = [
  'United States', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain',
  'Saudi Arabia', 'UAE', 'Turkey', 'Brazil', 'Mexico', 'Argentina',
  'Chile', 'Colombia', 'Peru', 'Vietnam', 'Thailand', 'Malaysia',
  'Indonesia', 'Philippines', 'India', 'Pakistan', 'Egypt', 'South Africa',
  'Australia', 'Canada', 'Netherlands', 'Belgium', 'Poland', 'Sweden',
];

const KEYWORD_OPTIONS = [
  'toy store', 'toy distributor', 'toy wholesaler', 'toy importer',
  'toy supplier', 'toy manufacturer', 'toy trading company',
  'bubble toys', 'bubble machine', 'bubble gun',
  'RC toys', 'RC car', 'remote control toys',
  'building blocks', 'plastic building blocks', 'educational blocks',
  'beach toys', 'sand toys', 'outdoor toys',
  'plastic toys', 'educational toys', 'kids toys', 'baby toys',
  'gift shop', 'party supplies', 'novelty toys',
  'toy wholesale', 'toy import', 'toy export',
  'kids store', 'children store', 'baby store',
  'game store', 'hobby shop', 'stationery store',
];

export default function MapsScraperPage() {
  const [country, setCountry] = useState('United States');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [keyword, setKeyword] = useState('toy store');
  const [perArea, setPerArea] = useState(10);
  const [extractEmail, setExtractEmail] = useState(true);
  const [presetName, setPresetName] = useState('');

  const [tasks, setTasks] = useState<MapsScraperTask[]>([]);
  const [currentTask, setCurrentTask] = useState<MapsScraperTask | null>(null);
  const [results, setResults] = useState<MapsScraperResult[]>([]);
  const [presets, setPresets] = useState<MapsScraperPreset[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [starting, setStarting] = useState(false);
  const [activeTab, setActiveTab] = useState('results');
  const logRef = useRef<HTMLDivElement>(null);

  const isRunning = currentTask?.status === 'running';

  useEffect(() => {
    loadTasks();
    loadPresets();
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [currentTask?.logs]);

  const loadTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
      if (data.length > 0 && !currentTask) {
        setCurrentTask(data[0]);
        loadResults(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load tasks', e);
    }
  };

  const loadPresets = async () => {
    try {
      const data = await getPresets();
      setPresets(data);
    } catch (e) {
      console.error('Failed to load presets', e);
    }
  };

  const loadResults = async (taskId: number, search?: string) => {
    try {
      const data = await getResults(taskId, search);
      setResults(data);
    } catch (e) {
      console.error('Failed to load results', e);
    }
  };

  const handleStart = async () => {
    if (!keyword.trim()) {
      toast.error('请输入关键词');
      return;
    }
    setStarting(true);
    setSelectedIds(new Set());
    try {
      const task = await createTask({
        country, state: state || undefined, city: city || undefined,
        keyword, perArea, extractEmail,
      });
      setCurrentTask(task);
      toast.success('任务已创建，启动浏览器采集...');

      await startTask(task.id);
      await loadTasks();

      const pollInterval = setInterval(async () => {
        try {
          const updated = await getTask(task.id);
          setCurrentTask(updated);
          if (updated.status === 'running') {
            await loadResults(task.id);
          }
          if (updated.status === 'completed' || updated.status === 'failed' || updated.status === 'stopped') {
            clearInterval(pollInterval);
            await loadResults(task.id);
            await loadTasks();
            if (updated.status === 'completed') {
              toast.success(`采集完成，共获取 ${updated.totalResults} 条结果`);
            } else if (updated.status === 'failed') {
              toast.error('采集失败，请查看日志');
            } else {
              toast.info('采集已停止');
            }
          }
        } catch { /* ignore */ }
      }, 3000);
    } catch (e) {
      toast.error('启动采集失败');
      console.error(e);
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    if (!currentTask) return;
    try {
      const stopped = await stopTask(currentTask.id);
      setCurrentTask(stopped);
      await loadTasks();
      toast.info('任务已停止');
    } catch (e) {
      toast.error('停止失败');
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast.error('请输入预设名称');
      return;
    }
    try {
      await createPreset({
        name: presetName, country, state: state || undefined,
        city: city || undefined, keyword, perArea, extractEmail,
      });
      setPresetName('');
      await loadPresets();
      toast.success('预设已保存');
    } catch (e) {
      toast.error('保存预设失败');
    }
  };

  const applyPreset = (preset: MapsScraperPreset) => {
    setCountry(preset.country);
    setState(preset.state || '');
    setCity(preset.city || '');
    setKeyword(preset.keyword);
    setPerArea(preset.perArea);
    setExtractEmail(preset.extractEmail);
    setShowPresets(false);
    toast.success(`已应用预设: ${preset.name}`);
  };

  const handleDeletePreset = async (id: number) => {
    try {
      await deletePreset(id);
      await loadPresets();
      toast.success('预设已删除');
    } catch (e) {
      toast.error('删除失败');
    }
  };

  const handleSelectTask = (task: MapsScraperTask) => {
    setCurrentTask(task);
    setSelectedIds(new Set());
    loadResults(task.id);
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await deleteTask(id);
      await loadTasks();
      if (currentTask?.id === id) {
        setCurrentTask(null);
        setResults([]);
      }
      toast.success('任务已删除');
    } catch (e) {
      toast.error('删除失败');
    }
  };

  const handleAddToCustomer = async (result: MapsScraperResult) => {
    try {
      await addResultToCustomer(result.id);
      setResults((prev) => prev.map((r) => (r.id === result.id ? { ...r, addedToCustomer: true } : r)));
      toast.success(`已添加到客户管理: ${result.name}`);
    } catch (e) {
      toast.error('添加失败');
    }
  };

  const handleBatchAddToCustomer = async () => {
    if (selectedIds.size === 0) {
      toast.error('请先选择要添加的客户');
      return;
    }
    let success = 0;
    for (const id of selectedIds) {
      try {
        await addResultToCustomer(id);
        success++;
      } catch { /* ignore */ }
    }
    setResults((prev) => prev.map((r) => selectedIds.has(r.id) ? { ...r, addedToCustomer: true } : r));
    setSelectedIds(new Set());
    toast.success(`已批量添加 ${success} 个客户到客户管理`);
  };

  const handleDeleteResult = async (id: number) => {
    try {
      await deleteResult(id);
      setResults((prev) => prev.filter((r) => r.id !== id));
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      toast.success('已删除');
    } catch (e) {
      toast.error('删除失败');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map((r) => r.id)));
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) {
      toast.error('没有可导出的数据');
      return;
    }
    const headers = ['Keyword', 'Industry', 'Name', 'Address', 'City', 'State', 'Zip Code', 'Phone', 'WhatsApp', 'Email', 'Website', 'Rating'];
    const rows = results.map((r) => [
      r.keyword || '', r.industry || '', r.name, r.address || '', r.city || '',
      r.state || '', r.zipCode || '', r.phone || '', r.whatsapp || '', r.email || '', r.website || '', r.rating || '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maps_scraper_${currentTask?.keyword || 'results'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV已导出');
  };

  const handleExportExcel = () => {
    if (results.length === 0) {
      toast.error('没有可导出的数据');
      return;
    }
    try {
      const headers = ['No.', 'Keyword', 'Industry', 'Company Name', 'Address', 'City', 'State', 'Zip Code', 'Phone', 'WhatsApp', 'Email', 'Website', 'Rating'];
      const dataRows = results.map((r, idx) => [
        idx + 1, r.keyword || '', r.industry || '', r.name, r.address || '',
        r.city || '', r.state || '', r.zipCode || '', r.phone || '', r.whatsapp || '', r.email || '',
        r.website || '', r.rating || '',
      ]);
      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const headerStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        fill: { fgColor: { rgb: '1F4E78' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { top: { style: 'thin', color: { rgb: 'CCCCCC' } }, bottom: { style: 'thin', color: { rgb: 'CCCCCC' } }, left: { style: 'thin', color: { rgb: 'CCCCCC' } }, right: { style: 'thin', color: { rgb: 'CCCCCC' } } },
      };
      const cellStyle = {
        alignment: { vertical: 'center', wrapText: true },
        border: { top: { style: 'thin', color: { rgb: 'DDDDDD' } }, bottom: { style: 'thin', color: { rgb: 'DDDDDD' } }, left: { style: 'thin', color: { rgb: 'DDDDDD' } }, right: { style: 'thin', color: { rgb: 'DDDDDD' } } },
      };
      const altRowStyle = { ...cellStyle, fill: { fgColor: { rgb: 'F5F7FA' } } };
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
          ws[cellRef].s = R === 0 ? headerStyle : (R % 2 === 0 ? altRowStyle : cellStyle);
        }
      }
      ws['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 30 }, { wch: 30 }, { wch: 8 }];
      ws['!rows'] = [{ hpt: 28 }, ...Array(dataRows.length).fill({ hpt: 22 })];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Leads');
      const summaryData = [['Export Summary'], ['Task Name', currentTask?.name || '-'], ['Country', currentTask?.country || '-'], ['Keyword', currentTask?.keyword || '-'], ['Total Records', results.length], ['Export Time', new Date().toLocaleString('zh-CN')]];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWs['!cols'] = [{ wch: 18 }, { wch: 40 }];
      if (summaryWs['A1']) summaryWs['A1'].s = { font: { bold: true, sz: 14 } };
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      const fileName = `maps_scraper_${currentTask?.keyword || 'leads'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success(`Excel已导出: ${fileName}`);
    } catch (e) {
      console.error('Excel export failed', e);
      toast.error('Excel导出失败，已改用CSV导出');
      handleExportCSV();
    }
  };

  const handleSearch = (value: string) => {
    setSearchFilter(value);
    if (currentTask) loadResults(currentTask.id, value || undefined);
  };

  const progress = currentTask && currentTask.totalAreas > 0
    ? Math.round((currentTask.completedAreas / currentTask.totalAreas) * 100) : 0;

  const statusConfig: Record<string, { label: string; class: string; dot: string }> = {
    running: { label: '采集中', class: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500 animate-pulse' },
    completed: { label: '已完成', class: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
    failed: { label: '失败', class: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
    stopped: { label: '已停止', class: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
    pending: { label: '待开始', class: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  };

  const getStatus = (s: string) => statusConfig[s] || statusConfig.pending;

  const stats = [
    { label: '总任务', value: tasks.length, icon: History, color: 'from-blue-500 to-blue-600', text: 'text-blue-600' },
    { label: '已完成', value: tasks.filter((t) => t.status === 'completed').length, icon: CheckCircle2, color: 'from-green-500 to-green-600', text: 'text-green-600' },
    { label: '失败', value: tasks.filter((t) => t.status === 'failed').length, icon: XCircle, color: 'from-red-500 to-red-600', text: 'text-red-600' },
    { label: '已采集商家', value: currentTask?.totalResults || 0, icon: Target, color: 'from-orange-500 to-orange-600', text: 'text-orange-600' },
  ];

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <MapPin className="size-5" />
            </span>
            Google Maps 数据采集器
          </h1>
          <p className="text-sm text-muted-foreground mt-1 ml-11">基于 Google Maps 商家信息采集，支持全球主要国家和地区</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={results.length === 0}>
            <Download className="mr-1.5 size-3.5" /> 导出 CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={results.length === 0}>
            <FileSpreadsheet className="mr-1.5 size-3.5" /> 导出 Excel
          </Button>
        </div>
      </div>

      {/* Collection Settings */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              采集设置
              {isRunning && <span className="text-xs text-blue-500 font-normal flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />运行中</span>}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowPresets(!showPresets)} className="h-7">
              <Save className="mr-1 size-3.5" /> 预设 {presets.length > 0 && `(${presets.length})`}
              <ChevronDown className={`ml-1 size-3 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showPresets && presets.length > 0 && (
            <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
              <div className="text-xs font-medium text-muted-foreground">已保存的预设</div>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <div key={p.id} className="flex items-center gap-1 bg-background border rounded-md overflow-hidden">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => applyPreset(p)}>
                      {p.name}
                    </Button>
                    <button onClick={() => handleDeletePreset(p.id)} className="px-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">国家 *</Label>
              <Select value={country} onValueChange={setCountry} disabled={isRunning}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {COUNTRY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">省份/州</Label>
              <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="可选" className="h-9" disabled={isRunning} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">城市</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="全部" className="h-9" disabled={isRunning} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">关键词 *</Label>
              <div className="relative">
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  list="keyword-options"
                  placeholder="输入或选择关键词"
                  className="h-9 pr-8"
                  disabled={isRunning}
                />
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <datalist id="keyword-options">
                  {KEYWORD_OPTIONS.map((k) => <option key={k} value={k} />)}
                </datalist>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">每区采集数</Label>
              <Input type="number" min={1} max={50} value={perArea} onChange={(e) => setPerArea(Number(e.target.value))} className="h-9" disabled={isRunning} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">挖邮箱</Label>
              <Select value={extractEmail ? 'yes' : 'no'} onValueChange={(v) => setExtractEmail(v === 'yes')} disabled={isRunning}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">是</SelectItem>
                  <SelectItem value="no">否</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-1">
            <Button onClick={handleStart} disabled={starting || isRunning} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-sm">
              {starting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Play className="mr-2 size-4" />}
              开始采集
            </Button>
            <Button variant="destructive" onClick={handleStop} disabled={!isRunning} className="shadow-sm">
              <Square className="mr-2 size-4" /> 停止
            </Button>
            <div className="flex items-center gap-2 ml-auto">
              <Input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="预设名称" className="w-36 h-9" disabled={isRunning} />
              <Button variant="outline" size="sm" onClick={handleSavePreset} disabled={isRunning} className="h-9">
                <Save className="mr-1.5 size-3.5" /> 保存预设
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="border shadow-sm overflow-hidden">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} text-white shrink-0`}>
                <s.icon className="size-5" />
              </div>
              <div>
                <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress */}
      {currentTask && (
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <Badge className={`${getStatus(currentTask.status).class} border font-medium`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatus(currentTask.status).dot}`} />
                  {getStatus(currentTask.status).label}
                </Badge>
                <span className="font-medium">{currentTask.name}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle2 className="size-3.5 text-green-500" /> {currentTask.completedAreas}</span>
                <span className="flex items-center gap-1"><XCircle className="size-3.5 text-red-500" /> {currentTask.failedAreas}</span>
                <span className="flex items-center gap-1"><Clock className="size-3.5" /> {currentTask.totalAreas} 区</span>
                <span className="font-semibold text-foreground text-sm">{progress}%</span>
              </div>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${currentTask.status === 'failed' ? 'bg-red-500' : currentTask.status === 'stopped' ? 'bg-yellow-500' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="results" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            实时结果 {results.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{results.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            运行日志
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            历史任务 {tasks.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{tasks.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-4">
          <Card className="border shadow-sm">
            <CardContent className="p-0">
              {/* Toolbar */}
              <div className="p-3 border-b flex items-center gap-2 flex-wrap bg-muted/20">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  disabled={results.length === 0}
                >
                  {selectedIds.size === results.length && results.length > 0
                    ? <CheckSquare className="size-4 text-primary" />
                    : <SquareIcon className="size-4" />}
                  全选
                </button>
                {selectedIds.size > 0 && (
                  <>
                    <span className="text-xs text-muted-foreground">已选 {selectedIds.size} 项</span>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleBatchAddToCustomer}>
                      <UserPlus className="mr-1 size-3" /> 批量添加客户
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setSelectedIds(new Set())}>
                      取消选择
                    </Button>
                  </>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      placeholder="搜索名称、城市、邮箱..."
                      value={searchFilter}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-8 h-8 w-56 text-xs"
                    />
                  </div>
                  {currentTask && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => loadResults(currentTask.id)}>
                      <RefreshCw className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Results table */}
              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#1F4E78] text-white sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-2.5 text-center w-10"></th>
                      <th className="px-2 py-2.5 text-center w-10">#</th>
                      <th className="px-2 py-2.5 text-left min-w-[140px]">公司名称</th>
                      <th className="px-2 py-2.5 text-left min-w-[120px]">地址</th>
                      <th className="px-2 py-2.5 text-left w-24">城市</th>
                      <th className="px-2 py-2.5 text-left w-28">电话</th>
                      <th className="px-2 py-2.5 text-left w-28">WhatsApp</th>
                      <th className="px-2 py-2.5 text-left min-w-[160px]">邮箱</th>
                      <th className="px-2 py-2.5 text-center w-16">评分</th>
                      <th className="px-2 py-2.5 text-center w-24">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-2 py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                            <MapPin className="size-10 opacity-30" />
                            <span className="text-sm">暂无数据，点击"开始采集"获取商家信息</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      results.map((r, idx) => {
                        const isSelected = selectedIds.has(r.id);
                        return (
                          <tr key={r.id} className={`border-b transition-colors ${isSelected ? 'bg-blue-50/50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30`}>
                            <td className="px-2 py-2 text-center">
                              <button onClick={() => toggleSelect(r.id)} className="text-muted-foreground hover:text-primary">
                                {isSelected ? <CheckSquare className="size-4 text-primary" /> : <SquareIcon className="size-4" />}
                              </button>
                            </td>
                            <td className="px-2 py-2 text-center text-gray-400">{idx + 1}</td>
                            <td className="px-2 py-2">
                              <div className="font-medium text-foreground">{r.name}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">{r.keyword} · {r.industry}</div>
                            </td>
                            <td className="px-2 py-2 text-gray-600 max-w-[180px] truncate" title={r.address}>{r.address}</td>
                            <td className="px-2 py-2">{r.city}</td>
                            <td className="px-2 py-2">
                              {r.phone && <a href={`tel:${r.phone}`} className="text-blue-600 hover:underline">{r.phone}</a>}
                            </td>
                            <td className="px-2 py-2">
                              {r.whatsapp && r.whatsapp.replace(/[^0-9]/g, '') !== (r.phone || '').replace(/[^0-9]/g, '') && (
                                <a href={`https://wa.me/${r.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                                  {r.whatsapp}
                                </a>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              {r.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email) && !/\.(jpg|jpeg|png|gif|webp|svg|pdf|zip)$/i.test(r.email) && (
                                <a href={`mailto:${r.email}`} className="text-blue-600 hover:underline">{r.email}</a>
                              )}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {r.rating && <span className="inline-flex items-center gap-0.5 text-amber-600 font-medium">★ {r.rating}</span>}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <div className="flex items-center justify-center gap-0.5">
                                {r.website && (
                                  <a href={r.website} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-sky-50 text-sky-500 hover:text-sky-600 transition-colors" title="访问官网">
                                    <Globe className="size-3.5" />
                                  </a>
                                )}
                                <button
                                  onClick={() => handleAddToCustomer(r)}
                                  disabled={r.addedToCustomer}
                                  className={`p-1.5 rounded transition-colors ${r.addedToCustomer ? 'text-green-500 cursor-default' : 'text-gray-400 hover:bg-blue-50 hover:text-blue-500'}`}
                                  title={r.addedToCustomer ? '已添加到客户管理' : '添加到客户管理'}
                                >
                                  {r.addedToCustomer ? <CheckCircle2 className="size-3.5" /> : <UserPlus className="size-3.5" />}
                                </button>
                                <button
                                  onClick={() => handleDeleteResult(r.id)}
                                  className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                  title="删除"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card className="border shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/20">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  运行日志
                </span>
                {currentTask?.logs && currentTask.logs.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => {
                    const text = currentTask.logs.join('\n');
                    navigator.clipboard.writeText(text);
                    toast.success('日志已复制');
                  }}>
                    <Copy className="mr-1 size-3" /> 复制日志
                  </Button>
                )}
              </div>
              <div
                ref={logRef}
                className="bg-[#0d1117] text-green-400 p-4 font-mono text-xs h-72 overflow-y-auto leading-relaxed"
              >
                {currentTask?.logs && currentTask.logs.length > 0 ? (
                  currentTask.logs.map((log, idx) => (
                    <div key={idx} className={`py-0.5 ${log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : log.includes('🎉') ? 'text-yellow-400' : log.includes('🚀') || log.includes('🌐') ? 'text-blue-400' : 'text-gray-300'}`}>
                      <span className="text-gray-600 mr-2">[{String(idx + 1).padStart(3, '0')}]</span>
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-600 flex flex-col items-center justify-center h-full gap-2">
                    <AlertCircle className="size-8 opacity-30" />
                    <span>暂无日志，开始采集后将显示运行记录...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card className="border shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">任务名称</th>
                      <th className="px-4 py-2.5 text-left font-medium">国家</th>
                      <th className="px-4 py-2.5 text-left font-medium">关键词</th>
                      <th className="px-4 py-2.5 text-center font-medium">状态</th>
                      <th className="px-4 py-2.5 text-center font-medium">结果数</th>
                      <th className="px-4 py-2.5 text-left font-medium">创建时间</th>
                      <th className="px-4 py-2.5 text-center font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                          <div className="flex flex-col items-center gap-2">
                            <History className="size-8 opacity-30" />
                            <span>暂无历史任务</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      tasks.map((t) => (
                        <tr key={t.id} className={`border-t hover:bg-muted/30 cursor-pointer transition-colors ${currentTask?.id === t.id ? 'bg-blue-50/40' : ''}`} onClick={() => handleSelectTask(t)}>
                          <td className="px-4 py-2.5 font-medium">{t.name}</td>
                          <td className="px-4 py-2.5 text-gray-600">{t.country}</td>
                          <td className="px-4 py-2.5 text-gray-600">{t.keyword}</td>
                          <td className="px-4 py-2.5 text-center">
                            <Badge className={`${getStatus(t.status).class} border text-xs`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1 ${getStatus(t.status).dot}`} />
                              {getStatus(t.status).label}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-center font-medium">{t.totalResults}</td>
                          <td className="px-4 py-2.5 text-gray-500">{new Date(t.createdAt).toLocaleString('zh-CN')}</td>
                          <td className="px-4 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleSelectTask(t)}>
                                查看
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteTask(t.id)}>
                                <Trash2 className="size-3.5 text-red-400" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
