import { useState } from 'react';
import { Search, Save, UserPlus, Filter, TrendingUp, Building2, Mail, Phone, Globe, Linkedin, Facebook, Instagram, Star, ChevronDown, ChevronUp, Loader2, Sparkles, Target, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import http from '@/utils/http';

const PRODUCT_OPTIONS = ['Bubble Toys', 'RC Toys', 'Building Blocks', 'Beach Toys', 'Plastic Toys', 'Educational Toys'];
const COUNTRY_OPTIONS = ['Saudi Arabia', 'UAE', 'Vietnam', 'Brazil', 'Chile', 'Poland', 'Mexico', 'Malaysia', 'USA', 'Israel'];
const CUSTOMER_TYPE_OPTIONS = ['Importer', 'Distributor', 'Wholesaler', 'Toy Store Chain', 'E-commerce Seller', 'Trading Company'];

interface Lead {
  id: number;
  companyName: string;
  website: string;
  country: string;
  city: string;
  businessType: string;
  companySize: string;
  email: string;
  phone: string;
  whatsapp: string;
  linkedin: string;
  facebook: string;
  instagram: string;
  contactPerson: string;
  jobTitle: string;
  leadScore: number;
  leadGrade: 'A' | 'B' | 'C' | 'D';
  isSaved: boolean;
  scoreDetails?: any;
}

export default function AiLeadPage() {
  const [productName, setProductName] = useState('Bubble Toys');
  const [keywords, setKeywords] = useState('');
  const [hsCode, setHsCode] = useState('9503');
  const [industry, setIndustry] = useState('Toys & Games');
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['Saudi Arabia', 'UAE']);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['Importer', 'Distributor', 'Wholesaler']);
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [expandedLead, setExpandedLead] = useState<number | null>(null);
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [savingId, setSavingId] = useState<number | null>(null);

  const toggleCountry = (c: string) => {
    setSelectedCountries(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };
  const toggleType = (t: string) => {
    setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const startSearch = async () => {
    if (selectedCountries.length === 0 || selectedTypes.length === 0) {
      alert('请至少选择一个目标国家和客户类型');
      return;
    }
    setLoading(true);
    setLeads([]);
    try {
      const res = await http.post('/api/ai-leads/search', { productName, keywords: keywords.split(',').map(k => k.trim()).filter(Boolean), hsCode, industry, targetCountries: selectedCountries, targetCustomerTypes: selectedTypes });
      setLeads(res.data.leads || []);
      loadHistory();
    } catch (e) {
      console.error(e);
      alert('搜索失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await http.get('/api/ai-leads/searches?page=1&pageSize=10');
      setSearchHistory(res.data.items || []);
    } catch {}
  };

  const saveToCustomer = async (lead: Lead) => {
    setSavingId(lead.id);
    try {
      await http.post(`/api/ai-leads/${lead.id}/save-to-customer`);
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, isSaved: true } : l));
      alert('已保存到客户管理');
    } catch (e) {
      alert('保存失败');
    } finally {
      setSavingId(null);
    }
  };

  const filteredLeads = filterGrade === 'all' ? leads : leads.filter(l => l.leadGrade === filterGrade);

  const gradeConfig = (grade: string) => {
    switch (grade) {
      case 'A': return { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-50', label: '高优先' };
      case 'B': return { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-50', label: '潜在客户' };
      case 'C': return { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-50', label: '低优先' };
      case 'D': return { bg: 'bg-gray-400', text: 'text-gray-600', light: 'bg-gray-50', label: '不推荐' };
      default: return { bg: 'bg-gray-400', text: 'text-gray-600', light: 'bg-gray-50', label: '未知' };
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-500';
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">AI 自动获客</h1>
          </div>
          <p className="text-muted-foreground text-base">输入产品和目标市场，AI 自动搜索潜在客户并智能评分分级</p>
        </div>
      </div>

      {/* Stats Bar */}
      {leads.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-5">
              <div className="text-3xl font-bold text-green-600">{leads.filter(l => l.leadGrade === 'A').length}</div>
              <div className="text-sm text-muted-foreground mt-1">A 级高优先</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-5">
              <div className="text-3xl font-bold text-blue-600">{leads.filter(l => l.leadGrade === 'B').length}</div>
              <div className="text-sm text-muted-foreground mt-1">B 级潜在</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-5">
              <div className="text-3xl font-bold text-yellow-600">{leads.filter(l => l.leadGrade === 'C').length}</div>
              <div className="text-sm text-muted-foreground mt-1">C 级低优先</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-5">
              <div className="text-3xl font-bold text-purple-600">{leads.length}</div>
              <div className="text-sm text-muted-foreground mt-1">总客户数</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="h-11">
          <TabsTrigger value="search" className="px-6 text-base">
            <Search className="w-4 h-4 mr-2" />新建搜索
          </TabsTrigger>
          <TabsTrigger value="history" onClick={loadHistory} className="px-6 text-base">
            <TrendingUp className="w-4 h-4 mr-2" />搜索历史
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-8 mt-6">
          {/* Search Form */}
          <Card className="shadow-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">搜索条件</CardTitle>
                  <CardDescription className="mt-1">填写产品信息和目标市场，AI 将自动生成客户搜索策略</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Product Info Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">产品名称 <span className="text-red-500">*</span></Label>
                  <Select value={productName} onValueChange={setProductName}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>{PRODUCT_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">HS Code</Label>
                  <Input value={hsCode} onChange={e => setHsCode(e.target.value)} placeholder="9503" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">行业</Label>
                  <Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="Toys & Games" className="h-11" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">关键词（逗号分隔，可选）</Label>
                <Input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="bubble gun, bubble machine, outdoor toys" className="h-11" />
              </div>

              {/* Target Countries */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">目标国家 <span className="text-red-500">*</span>（可多选）</Label>
                  <span className="text-xs text-muted-foreground">已选 {selectedCountries.length} 个</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {COUNTRY_OPTIONS.map(c => (
                    <button
                      key={c}
                      onClick={() => toggleCountry(c)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                        selectedCountries.includes(c)
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background hover:bg-accent border-border hover:border-primary/30'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Customer Types */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">目标客户类型 <span className="text-red-500">*</span>（可多选）</Label>
                  <span className="text-xs text-muted-foreground">已选 {selectedTypes.length} 个</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {CUSTOMER_TYPE_OPTIONS.map(t => (
                    <button
                      key={t}
                      onClick={() => toggleType(t)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                        selectedTypes.includes(t)
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background hover:bg-accent border-border hover:border-primary/30'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button onClick={startSearch} disabled={loading} size="lg" className="px-8 h-12 text-base">
                  {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                  {loading ? 'AI 智能搜索中...' : '开始 AI 获客搜索'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {leads.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">搜索结果</CardTitle>
                  <CardDescription className="mt-1">共找到 {leads.length} 个潜在客户</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={filterGrade} onValueChange={setFilterGrade}>
                    <SelectTrigger className="w-40 h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部等级</SelectItem>
                      <SelectItem value="A">A级 高优先</SelectItem>
                      <SelectItem value="B">B级 潜在</SelectItem>
                      <SelectItem value="C">C级 低优先</SelectItem>
                      <SelectItem value="D">D级 不推荐</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                {filteredLeads.map(lead => {
                  const gc = gradeConfig(lead.leadGrade);
                  return (
                    <div key={lead.id} className="border rounded-xl p-6 hover:border-primary/40 hover:shadow-md transition-all bg-card">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5 text-slate-600" />
                            </div>
                            <span className="text-lg font-semibold">{lead.companyName}</span>
                            <Badge className={`${gc.bg} text-white border-0`}>{lead.leadGrade}级 · {gc.label}</Badge>
                            <Badge variant="outline" className="font-normal">{lead.businessType}</Badge>
                            {lead.isSaved && <Badge variant="secondary" className="font-normal">已保存</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground mt-3 flex items-center gap-4 flex-wrap">
                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{lead.country}, {lead.city}</span>
                            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{lead.companySize}</span>
                            {lead.contactPerson && <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" />{lead.contactPerson} · {lead.jobTitle}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`text-4xl font-bold ${scoreColor(lead.leadScore)}`}>{lead.leadScore}</div>
                          <div className="text-xs text-muted-foreground mt-1">Lead Score</div>
                        </div>
                      </div>

                      {/* Contact Links */}
                      <div className="flex items-center gap-4 mt-5 flex-wrap">
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="text-sm flex items-center gap-1.5 text-primary hover:underline">
                            <Mail className="w-4 h-4" />{lead.email}
                          </a>
                        )}
                        {lead.phone && (
                          <span className="text-sm flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="w-4 h-4" />{lead.phone}
                          </span>
                        )}
                        {lead.website && (
                          <a href={lead.website} target="_blank" rel="noopener" className="text-sm flex items-center gap-1.5 text-primary hover:underline">
                            <Globe className="w-4 h-4" />官网
                          </a>
                        )}
                        {lead.linkedin && (
                          <a href={lead.linkedin} target="_blank" rel="noopener" className="text-sm flex items-center gap-1.5 text-[#0A66C2] hover:underline">
                            <Linkedin className="w-4 h-4" />LinkedIn
                          </a>
                        )}
                        {lead.facebook && (
                          <a href={lead.facebook} target="_blank" rel="noopener" className="text-sm flex items-center gap-1.5 text-[#1877F2] hover:underline">
                            <Facebook className="w-4 h-4" />Facebook
                          </a>
                        )}
                        {lead.instagram && (
                          <a href={lead.instagram} target="_blank" rel="noopener" className="text-sm flex items-center gap-1.5 text-[#E4405F] hover:underline">
                            <Instagram className="w-4 h-4" />Instagram
                          </a>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 mt-5 pt-5 border-t">
                        <Button size="sm" variant="outline" onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)} className="h-9 px-4">
                          {expandedLead === lead.id ? <ChevronUp className="w-4 h-4 mr-1.5" /> : <ChevronDown className="w-4 h-4 mr-1.5" />}
                          评分详情
                        </Button>
                        <Button size="sm" onClick={() => saveToCustomer(lead)} disabled={lead.isSaved || savingId === lead.id} className="h-9 px-4">
                          {savingId === lead.id ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                          {lead.isSaved ? '已保存' : '保存到客户'}
                        </Button>
                        <Button size="sm" variant="secondary" asChild className="h-9 px-4">
                          <a href={`/ai-outreach?customer=${encodeURIComponent(lead.companyName)}&country=${encodeURIComponent(lead.country)}`}>
                            <UserPlus className="w-4 h-4 mr-1.5" />AI 开发
                          </a>
                        </Button>
                      </div>

                      {/* Score Details */}
                      {expandedLead === lead.id && lead.scoreDetails && (
                        <div className="mt-5 p-5 bg-muted/50 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(lead.scoreDetails).map(([k, v]) => (
                            <div key={k} className="text-center">
                              <div className="text-2xl font-bold text-primary">{v as number}</div>
                              <div className="text-xs text-muted-foreground mt-1 capitalize">{k.replace(/([A-Z])/g, ' $1')}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">搜索历史</CardTitle>
              <CardDescription>查看之前的AI获客搜索记录</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {searchHistory.length === 0 ? (
                <div className="p-16 text-center">
                  <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <div className="text-muted-foreground">暂无搜索历史</div>
                </div>
              ) : (
                <div className="divide-y">
                  {searchHistory.map((s: any) => (
                    <div key={s.id} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Search className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-base">{s.productName}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {new Date(s.createdAt).toLocaleString()} · {s.resultCount || 0} 条结果 · {s.targetCountries ? JSON.parse(s.targetCountries).join(', ') : ''}
                          </div>
                        </div>
                      </div>
                      <Badge variant={s.status === 'completed' ? 'default' : 'secondary'} className="text-sm px-3 py-1">{s.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
