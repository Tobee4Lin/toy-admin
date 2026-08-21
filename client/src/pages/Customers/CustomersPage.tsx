import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Plus,
  Trash2,
  Edit3,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  listCustomers,
  getCustomerStats,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addFollowup,
  deleteFollowup,
  toggleFollowupReplied,
  createCustomerFromInquiry,
  type Customer,
  type CustomerStats,
  type CustomerFollowup,
} from '@/api/customers';
import { listInquiries, type Inquiry } from '@/api/inquiries';

const PRIORITY_COLORS: Record<string, string> = {
  A: 'bg-red-100 text-red-700 border-red-200',
  B: 'bg-orange-100 text-orange-700 border-orange-200',
  C: 'bg-blue-100 text-blue-700 border-blue-200',
  D: 'bg-gray-100 text-gray-600 border-gray-200',
};

const PRIORITY_LABELS: Record<string, string> = {
  A: 'A 重点',
  B: 'B 有需求',
  C: 'C 一般',
  D: 'D 暂无意向',
};

const SOURCE_LABELS: Record<string, string> = {
  manual: '手动录入',
  inquiry: '询盘转化',
  exhibition: '展会',
  google: '谷歌开发',
  alibaba: '阿里询盘',
  referral: '朋友推荐',
  other: '其他',
};

const CONTACT_FIELDS = [
  { key: 'contactPerson', label: '联系人', icon: Users },
  { key: 'whatsapp', label: 'WhatsApp', icon: Phone },
  { key: 'email', label: '邮箱', icon: Mail },
  { key: 'googleAddress', label: 'Google地址', icon: MapPin },
  { key: 'facebook', label: 'Facebook', icon: Globe },
  { key: 'instagram', label: 'Instagram', icon: Globe },
  { key: 'linkedin', label: 'LinkedIn', icon: Globe },
  { key: 'website', label: '网站', icon: Globe },
];

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

function emptyCustomerForm(): Partial<Customer> {
  return {
    company: '',
    country: '',
    city: '',
    background: '',
    scale: '',
    employeeCount: '',
    foundedYear: '',
    source: 'manual',
    contactPerson: '',
    whatsapp: '',
    googleAddress: '',
    facebook: '',
    website: '',
    email: '',
    instagram: '',
    linkedin: '',
    contactInvalid: {},
    customerType: '',
    priority: 'C',
    brandUsed: '',
    businessDetail: '',
  };
}

function EditCustomerDialog({
  open,
  onOpenChange,
  customer,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customer: Customer | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Customer>>(emptyCustomerForm());
  const [followups, setFollowups] = useState<CustomerFollowup[]>([]);
  const [newFollowup, setNewFollowup] = useState({ content: '', feedback: '' });
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (!open) return;
    if (customer) {
      // Edit mode: fetch full detail with followups
      setLoadingDetail(true);
      getCustomer(customer.id)
        .then((detail) => {
          setForm({ ...detail });
          setFollowups(detail.followups || []);
        })
        .catch(() => {
          setForm({ ...customer });
          setFollowups([]);
          toast.error('加载客户详情失败');
        })
        .finally(() => setLoadingDetail(false));
    } else {
      setForm(emptyCustomerForm());
      setFollowups([]);
    }
    setActiveTab('basic');
    setNewFollowup({ content: '', feedback: '' });
  }, [customer, open]);

  const updateField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleContactInvalid = (key: string) => {
    setForm((prev) => ({
      ...prev,
      contactInvalid: { ...(prev.contactInvalid || {}), [key]: !prev.contactInvalid?.[key] },
    }));
  };

  const handleSave = async () => {
    if (!form.company?.trim()) {
      toast.error('请填写公司名称');
      return;
    }
    setSaving(true);
    try {
      if (customer) {
        await updateCustomer(customer.id, form);
        toast.success('客户信息已更新');
      } else {
        await createCustomer(form);
        toast.success('客户已创建');
      }
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFollowup = async () => {
    if (!customer || !newFollowup.content.trim()) return;
    try {
      const f = await addFollowup(customer.id, {
        followDate: new Date().toISOString(),
        content: newFollowup.content,
        feedback: newFollowup.feedback,
      });
      setFollowups((prev) => [f, ...prev]);
      setNewFollowup({ content: '', feedback: '' });
      toast.success('跟进记录已添加');
    } catch (e) {
      toast.error('添加失败');
    }
  };

  const handleDeleteFollowup = async (fid: string) => {
    if (!confirm('确定删除这条跟进记录？')) return;
    try {
      await deleteFollowup(fid);
      setFollowups((prev) => prev.filter((f) => f.id !== fid));
    } catch (e) {
      toast.error('删除失败');
    }
  };

  const handleToggleReplied = async (fid: string) => {
    try {
      const res = await toggleFollowupReplied(fid);
      setFollowups((prev) => prev.map((f) => (f.id === fid ? { ...f, isReplied: res.isReplied } : f)));
    } catch (e) {
      toast.error('操作失败');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{customer ? '编辑客户' : '新增客户'}</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="mx-6">
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="contact">联系方式</TabsTrigger>
            <TabsTrigger value="business">业务信息</TabsTrigger>
            {customer && <TabsTrigger value="followup">跟进记录</TabsTrigger>}
          </TabsList>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loadingDetail ? (
              <div className="py-12 text-center text-sm text-muted-foreground">加载中...</div>
            ) : (
            <>
            <TabsContent value="basic" className="mt-0">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="col-span-2">
                  <Label className="text-sm">公司名称 *</Label>
                  <Input value={form.company || ''} onChange={(e) => updateField('company', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">客户编号</Label>
                  <Input value={form.customerNo || '自动生成'} disabled className="mt-1 bg-muted" />
                </div>
                <div>
                  <Label className="text-sm">国家/地区</Label>
                  <Input value={form.country || ''} onChange={(e) => updateField('country', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">城市</Label>
                  <Input value={form.city || ''} onChange={(e) => updateField('city', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">企业背景</Label>
                  <Select value={form.background || ''} onValueChange={(v) => updateField('background', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="选择背景" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="国企">国企</SelectItem>
                      <SelectItem value="外企">外企</SelectItem>
                      <SelectItem value="民营">民营</SelectItem>
                      <SelectItem value="个体">个体</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">企业规模</Label>
                  <Select value={form.scale || ''} onValueChange={(v) => updateField('scale', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="选择规模" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="大型">大型</SelectItem>
                      <SelectItem value="中型">中型</SelectItem>
                      <SelectItem value="小型">小型</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">员工人数</Label>
                  <Input value={form.employeeCount || ''} onChange={(e) => updateField('employeeCount', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">成立年份</Label>
                  <Input value={form.foundedYear || ''} onChange={(e) => updateField('foundedYear', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">客户来源</Label>
                  <Select value={form.source || 'manual'} onValueChange={(v) => updateField('source', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">手动录入</SelectItem>
                      <SelectItem value="inquiry">询盘转化</SelectItem>
                      <SelectItem value="exhibition">展会</SelectItem>
                      <SelectItem value="google">谷歌开发</SelectItem>
                      <SelectItem value="alibaba">阿里询盘</SelectItem>
                      <SelectItem value="referral">朋友推荐</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">客户类型</Label>
                  <Select value={form.customerType || ''} onValueChange={(v) => updateField('customerType', v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="选择类型" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="经销商">经销商</SelectItem>
                      <SelectItem value="批发商">批发商</SelectItem>
                      <SelectItem value="品牌方">品牌方</SelectItem>
                      <SelectItem value="电商卖家">电商卖家</SelectItem>
                      <SelectItem value="超市连锁">超市连锁</SelectItem>
                      <SelectItem value="采购代理">采购代理</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">优先级</Label>
                  <Select value={form.priority || 'C'} onValueChange={(v) => updateField('priority', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A 重点</SelectItem>
                      <SelectItem value="B">B 有需求</SelectItem>
                      <SelectItem value="C">C 一般</SelectItem>
                      <SelectItem value="D">D 暂无意向</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">使用品牌</Label>
                  <Input value={form.brandUsed || ''} onChange={(e) => updateField('brandUsed', e.target.value)} className="mt-1" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="mt-0">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {CONTACT_FIELDS.map(({ key, label, icon: Icon }) => {
                  const value = (form as any)[key] || '';
                  const invalid = form.contactInvalid?.[key];
                  return (
                    <div key={key} className={`flex items-start gap-3 rounded-lg border p-3 ${invalid ? 'border-red-200 bg-red-50' : 'border-border'}`}>
                      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs text-muted-foreground">{label}</Label>
                        <Input
                          value={value}
                          onChange={(e) => updateField(key, e.target.value)}
                          className="mt-1 h-8"
                          placeholder={`输入${label}`}
                        />
                      </div>
                      <button
                        onClick={() => toggleContactInvalid(key)}
                        className={`shrink-0 text-xs font-medium px-2 py-1 rounded mt-5 ${invalid ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}
                      >
                        {invalid ? '恢复' : '失效'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="business" className="mt-0">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">业务详情</Label>
                  <Textarea
                    value={form.businessDetail || ''}
                    onChange={(e) => updateField('businessDetail', e.target.value)}
                    className="mt-1"
                    rows={6}
                    placeholder="记录客户业务需求、感兴趣产品、采购意向等..."
                  />
                </div>
                {customer && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">最近跟进时间</Label>
                      <p className="text-sm font-medium mt-1">
                        {form.lastFollowUpAt ? new Date(form.lastFollowUpAt).toLocaleDateString('zh-CN') : '尚未跟进'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">创建时间</Label>
                      <p className="text-sm font-medium mt-1">
                        {form.createdAt ? new Date(form.createdAt).toLocaleDateString('zh-CN') : '-'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {customer && (
              <TabsContent value="followup" className="mt-0">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="跟进内容..."
                      value={newFollowup.content}
                      onChange={(e) => setNewFollowup({ ...newFollowup, content: e.target.value })}
                      className="flex-1"
                    />
                    <Input
                      placeholder="客户反馈（可选）"
                      value={newFollowup.feedback}
                      onChange={(e) => setNewFollowup({ ...newFollowup, feedback: e.target.value })}
                      className="flex-1"
                    />
                    <Button onClick={handleAddFollowup} size="sm">
                      <Plus className="h-4 w-4" /> 添加
                    </Button>
                  </div>
                  {followups.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">暂无跟进记录</div>
                  ) : (
                    <div className="space-y-2">
                      {followups.map((f) => (
                        <div key={f.id} className="flex items-start gap-3 rounded-lg border bg-background p-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <MessageSquare className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">{new Date(f.followDate).toLocaleString('zh-CN')}</span>
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleToggleReplied(f.id)} className={`flex items-center gap-1 text-xs ${f.isReplied ? 'text-green-600' : 'text-muted-foreground hover:text-green-600'}`}>
                                  {f.isReplied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                  {f.isReplied ? '已回复' : '未回复'}
                                </button>
                                <button onClick={() => handleDeleteFollowup(f.id)} className="text-muted-foreground hover:text-red-600">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="mt-1 text-sm">{f.content}</p>
                            {f.feedback && <p className="mt-1 text-xs text-muted-foreground">反馈：{f.feedback}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
            </>
            )}
          </div>
        </Tabs>
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportFromInquiryDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => void;
}) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      listInquiries({ pageSize: 100 })
        .then((res) => setInquiries(res.items || []))
        .catch(() => toast.error('加载询盘失败'))
        .finally(() => setLoading(false));
      setSelected(new Set());
    }
  }, [open]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === inquiries.length) setSelected(new Set());
    else setSelected(new Set(inquiries.map((i) => Number(i.id))));
  };

  const handleImport = async () => {
    if (selected.size === 0) {
      toast.error('请选择要导入的询盘');
      return;
    }
    setImporting(true);
    let success = 0;
    let failed = 0;
    for (const id of selected) {
      try {
        await createCustomerFromInquiry(id);
        success++;
      } catch (e) {
        failed++;
      }
    }
    setImporting(false);
    toast.success(`导入完成：成功 ${success} 条${failed > 0 ? `，失败 ${failed} 条` : ''}`);
    onOpenChange(false);
    onImported();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>从询盘导入客户</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">加载中...</div>
          ) : inquiries.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">暂无询盘数据</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={selected.size === inquiries.length} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead>客户名称</TableHead>
                  <TableHead>公司</TableHead>
                  <TableHead>国家</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>产品</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((inq) => (
                  <TableRow key={inq.id} className="cursor-pointer" onClick={() => toggleSelect(Number(inq.id))}>
                    <TableCell>
                      <Checkbox checked={selected.has(Number(inq.id))} />
                    </TableCell>
                    <TableCell className="font-medium">{inq.name || '-'}</TableCell>
                    <TableCell>{inq.company || '-'}</TableCell>
                    <TableCell>{inq.country || '-'}</TableCell>
                    <TableCell className="text-xs">{inq.email || '-'}</TableCell>
                    <TableCell className="text-xs">{inq.productName || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter className="border-t pt-4">
          <div className="flex-1 text-sm text-muted-foreground">已选择 {selected.size} 条</div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleImport} disabled={importing || selected.size === 0}>
            {importing ? '导入中...' : `导入选中 (${selected.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function exportToExcel(customers: Customer[]) {
  const headers = ['客户编号', '公司名称', '国家', '城市', '联系人', 'WhatsApp', '邮箱', '客户类型', '优先级', '来源', '最近跟进', '创建时间'];
  const rows = customers.map((c) => [
    c.customerNo,
    c.company,
    c.country || '',
    c.city || '',
    c.contactPerson || '',
    c.whatsapp || '',
    c.email || '',
    c.customerType || '',
    PRIORITY_LABELS[c.priority || 'C'] || c.priority,
    SOURCE_LABELS[c.source || ''] || c.source,
    c.lastFollowUpAt ? new Date(c.lastFollowUpAt).toLocaleDateString('zh-CN') : '未跟进',
    new Date(c.createdAt).toLocaleDateString('zh-CN'),
  ]);
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `客户列表_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('导出成功');
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [contactStatus, setContactStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        listCustomers({ search, contactStatus, priority, page, pageSize }),
        getCustomerStats(),
      ]);
      setCustomers(listRes.items);
      setTotal(listRes.total);
      setStats(statsRes);
    } catch (e) {
      console.error(e);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [search, contactStatus, priority, page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (c: Customer) => {
    setEditingCustomer(c);
    setEditDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该客户？相关跟进记录也会被删除。')) return;
    try {
      await deleteCustomer(id);
      toast.success('已删除');
      loadData();
    } catch (e) {
      toast.error('删除失败');
    }
  };

  const handleExport = () => {
    if (customers.length === 0) {
      toast.error('暂无数据可导出');
      return;
    }
    exportToExcel(customers);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="客户总数" value={stats?.total ?? 0} icon={Users} color="bg-blue-100 text-blue-600" />
        <StatCard title="未联系" value={stats?.notContacted ?? 0} icon={AlertCircle} color="bg-gray-100 text-gray-600" />
        <StatCard title="7天内已联系" value={stats?.contactedIn7Days ?? 0} icon={CheckCircle2} color="bg-green-100 text-green-600" />
        <StatCard title="超30天未跟进" value={stats?.notFollowedIn30Days ?? 0} icon={Clock} color="bg-orange-100 text-orange-600" />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索公司名、联系人、WhatsApp、邮箱..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={contactStatus} onValueChange={(v) => { setContactStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="联系状态" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="not_contacted">未联系</SelectItem>
              <SelectItem value="contacted_7d">7天内已联系</SelectItem>
              <SelectItem value="not_followed_30d">超30天未跟进</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={(v) => { setPriority(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="优先级" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部优先级</SelectItem>
              <SelectItem value="A">A 重点</SelectItem>
              <SelectItem value="B">B 有需求</SelectItem>
              <SelectItem value="C">C 一般</SelectItem>
              <SelectItem value="D">D 暂无意向</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="h-4 w-4" /> 从询盘导入
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" /> 导出Excel
            </Button>
            <Button onClick={handleAdd}>
              <UserPlus className="h-4 w-4" /> 新增客户
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">客户编号</TableHead>
              <TableHead>公司名称</TableHead>
              <TableHead>国家/地区</TableHead>
              <TableHead className="w-32">联系方式</TableHead>
              <TableHead className="w-24">优先级</TableHead>
              <TableHead className="w-24">来源</TableHead>
              <TableHead className="w-28">最近跟进</TableHead>
              <TableHead className="w-32 text-right pr-4">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">加载中...</TableCell></TableRow>
            ) : customers.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">暂无客户数据</TableCell></TableRow>
            ) : (
              customers.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(c)}>
                  <TableCell className="font-mono text-xs">{c.customerNo}</TableCell>
                  <TableCell className="font-medium">{c.company}</TableCell>
                  <TableCell>{c.country || '-'}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {c.whatsapp && (
                        <a
                          href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                          title={`WhatsApp: ${c.whatsapp}`}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                          title={`Email: ${c.email}`}
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {!c.whatsapp && !c.email && (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={PRIORITY_COLORS[c.priority || 'C']}>{PRIORITY_LABELS[c.priority || 'C']}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{SOURCE_LABELS[c.source || ''] || c.source || '-'}</TableCell>
                  <TableCell className="text-xs">
                    {c.lastFollowUpAt ? new Date(c.lastFollowUpAt).toLocaleDateString('zh-CN') : '未跟进'}
                  </TableCell>
                  <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(c)} className="h-8 px-2 text-primary">
                        <Edit3 className="h-4 w-4" /> 编辑
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="h-8 px-2 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between border-t p-4">
            <p className="text-sm text-muted-foreground">共 {total} 条，第 {page} / {totalPages} 页</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" /> 上一页
              </Button>
              <span className="text-sm px-2">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                下一页 <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <EditCustomerDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        customer={editingCustomer}
        onSaved={loadData}
      />

      <ImportFromInquiryDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImported={loadData}
      />
    </div>
  );
}
