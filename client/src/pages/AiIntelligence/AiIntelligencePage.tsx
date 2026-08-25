import { useState } from 'react';
import { Search, Building2, Globe, Mail, Phone, Linkedin, Facebook, Instagram, Youtube, TrendingUp, AlertTriangle, CheckCircle2, User, Star, Loader2, FileText, Brain, Shield, Target, Users, BarChart3, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import http from '@/utils/http';

interface IntelligenceReport {
  id: number;
  companyName: string;
  website: string;
  status: string;
  basicInfo?: any;
  businessInfo?: any;
  mainProducts?: any[];
  brandInfo?: any;
  marketCoverage?: any;
  socialMedia?: any;
  companyPotential?: any;
  riskAnalysis?: any;
  purchaseProbability?: string;
  recommendation?: any;
  contacts?: any[];
  createdAt: string;
}

export default function AiIntelligencePage() {
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<IntelligenceReport | null>(null);
  const [history, setHistory] = useState<IntelligenceReport[]>([]);

  const startAnalysis = async () => {
    if (!companyName.trim()) {
      alert('请输入公司名称');
      return;
    }
    setLoading(true);
    setReport(null);
    try {
      const res = await http.post('/api/ai-intelligence/analyze', { companyName, website });
      setReport(res.data);
      loadHistory();
    } catch (e) {
      console.error(e);
      alert('分析失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await http.get('/api/ai-intelligence/reports');
      setHistory(res.data.items || []);
    } catch {}
  };

  const loadReport = async (id: number) => {
    try {
      const res = await http.get(`/api/ai-intelligence/report/${id}`);
      setReport(res.data);
    } catch {}
  };

  const probabilityConfig = (p: string) => {
    if (p === 'High') return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    if (p === 'Medium') return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    return { color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' };
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">AI 客户背调</h1>
        </div>
        <p className="text-muted-foreground text-base">输入公司名称或网站，AI 自动生成完整客户情报报告与联系人识别</p>
      </div>

      <Tabs defaultValue="analyze" className="space-y-6">
        <TabsList className="h-11">
          <TabsTrigger value="analyze" className="px-6 text-base">
            <Search className="w-4 h-4 mr-2" />新建背调
          </TabsTrigger>
          <TabsTrigger value="history" onClick={loadHistory} className="px-6 text-base">
            <FileText className="w-4 h-4 mr-2" />历史报告
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-8 mt-6">
          {/* Input Form */}
          <Card className="shadow-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Search className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">输入客户信息</CardTitle>
                  <CardDescription className="mt-1">AI 将整合公开信息与授权数据源，生成完整情报报告</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">公司名称 <span className="text-red-500">*</span></Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="例如：HappyKids Trading Co." className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">公司网站（可选）</Label>
                  <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://www.example.com" className="h-11" />
                </div>
              </div>
              <div className="pt-2">
                <Button onClick={startAnalysis} disabled={loading} size="lg" className="px-8 h-12 text-base">
                  {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Brain className="w-5 h-5 mr-2" />}
                  {loading ? 'AI 深度分析中...' : '开始 AI 背调'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {report && report.status === 'completed' && (
            <div className="space-y-8">
              {/* Overview Card */}
              <Card className="shadow-sm border-l-4 border-l-purple-500">
                <CardHeader className="pb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-slate-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{report.basicInfo?.companyName}</CardTitle>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5" />
                          {report.basicInfo?.country}, {report.basicInfo?.city}
                        </div>
                      </div>
                    </div>
                    <Badge className={`${probabilityConfig(report.purchaseProbability || '').bg} ${probabilityConfig(report.purchaseProbability || '').color} ${probabilityConfig(report.purchaseProbability || '').border} border-2 px-4 py-1.5 text-sm`}>
                      采购可能性: {report.purchaseProbability}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-muted/30 rounded-xl">
                      <div className="text-4xl font-bold text-purple-600">{report.companyPotential?.overallScore || '-'}</div>
                      <div className="text-sm text-muted-foreground mt-2">公司潜力评分</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-xl">
                      <div className="text-2xl font-bold text-green-600 pt-1">{report.recommendation?.priority || '-'}</div>
                      <div className="text-sm text-muted-foreground mt-2">推荐优先级</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-xl">
                      <div className="text-lg font-semibold pt-2">{report.recommendation?.bestContact || '-'}</div>
                      <div className="text-sm text-muted-foreground mt-2">最佳联系人</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Two Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Info */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-500" />基础信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground text-sm">国家/城市</span>
                      <span className="font-medium text-sm">{report.basicInfo?.country}, {report.basicInfo?.city}</span>
                    </div>
                    <div className="flex justify-between items-start py-2 border-b gap-4">
                      <span className="text-muted-foreground text-sm shrink-0">地址</span>
                      <span className="text-right text-sm">{report.basicInfo?.address}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground text-sm">网站</span>
                      <a href={report.basicInfo?.website} target="_blank" rel="noopener" className="text-primary hover:underline text-sm flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />访问官网
                      </a>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground text-sm">电话</span>
                      <span className="text-sm">{report.basicInfo?.phone}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground text-sm">邮箱</span>
                      <span className="text-sm">{report.basicInfo?.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground text-sm">成立年份</span>
                      <span className="text-sm">{report.basicInfo?.foundedYear}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground text-sm">员工规模</span>
                      <span className="text-sm">{report.basicInfo?.employeeCount}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Info */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-green-500" />公司业务
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div>
                      <div className="text-xs text-muted-foreground mb-2 font-medium">业务类型</div>
                      <div className="flex flex-wrap gap-2">
                        {report.businessInfo?.types?.map((t: string) => (
                          <Badge key={t} variant="outline" className="px-3 py-1">{t}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-2 font-medium">主营产品</div>
                      <div className="flex flex-wrap gap-2">
                        {report.mainProducts?.map((p: any) => (
                          <Badge key={p.category} variant="secondary" className="px-3 py-1">{p.category} ({p.confidence})</Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{report.businessInfo?.description}</p>
                  </CardContent>
                </Card>

                {/* Brand Info */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />品牌信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 py-1.5">
                      {report.brandInfo?.hasOwnBrand ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />}
                      <span className="text-sm">自有品牌: <span className="font-medium">{report.brandInfo?.ownBrands?.join(', ')}</span></span>
                    </div>
                    <div className="flex items-center gap-2 py-1.5">
                      {report.brandInfo?.distributesImportedBrands ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />}
                      <span className="text-sm">代理进口品牌: <span className="font-medium">{report.brandInfo?.importedBrands?.join(', ')}</span></span>
                    </div>
                    <div className="flex items-center gap-2 py-1.5">
                      {report.brandInfo?.doesPrivateLabel ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />}
                      <span className="text-sm">支持 Private Label</span>
                    </div>
                    <div className="flex items-center gap-2 py-1.5">
                      {report.brandInfo?.doesOEM ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />}
                      <span className="text-sm">支持 OEM</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Market Coverage */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-500" />市场覆盖
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-2 font-medium">主要市场</div>
                      <div className="flex flex-wrap gap-2">
                        {report.marketCoverage?.primaryMarkets?.map((m: string) => (
                          <Badge key={m} className="px-3 py-1">{m}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-2 font-medium">次要市场</div>
                      <div className="flex flex-wrap gap-2">
                        {report.marketCoverage?.secondaryMarkets?.map((m: string) => (
                          <Badge key={m} variant="outline" className="px-3 py-1">{m}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 font-medium">分销渠道</div>
                      <div className="text-sm">{report.marketCoverage?.distributionChannels?.join(' · ')}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Social Media */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-pink-500" />社交媒体
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {report.socialMedia?.facebook && (
                      <div className="text-center p-5 border rounded-xl hover:shadow-md transition-shadow">
                        <Facebook className="w-7 h-7 mx-auto text-[#1877F2]" />
                        <div className="text-xl font-bold mt-2">{(report.socialMedia.facebook.followers / 1000).toFixed(1)}K</div>
                        <div className="text-xs text-muted-foreground mt-1">Facebook</div>
                      </div>
                    )}
                    {report.socialMedia?.instagram && (
                      <div className="text-center p-5 border rounded-xl hover:shadow-md transition-shadow">
                        <Instagram className="w-7 h-7 mx-auto text-[#E4405F]" />
                        <div className="text-xl font-bold mt-2">{(report.socialMedia.instagram.followers / 1000).toFixed(1)}K</div>
                        <div className="text-xs text-muted-foreground mt-1">Instagram</div>
                      </div>
                    )}
                    {report.socialMedia?.linkedin && (
                      <div className="text-center p-5 border rounded-xl hover:shadow-md transition-shadow">
                        <Linkedin className="w-7 h-7 mx-auto text-[#0A66C2]" />
                        <div className="text-xl font-bold mt-2">{(report.socialMedia.linkedin.followers / 1000).toFixed(1)}K</div>
                        <div className="text-xs text-muted-foreground mt-1">LinkedIn</div>
                      </div>
                    )}
                    {report.socialMedia?.tiktok && (
                      <div className="text-center p-5 border rounded-xl hover:shadow-md transition-shadow">
                        <span className="text-2xl">🎵</span>
                        <div className="text-xl font-bold mt-2">{(report.socialMedia.tiktok.followers / 1000).toFixed(1)}K</div>
                        <div className="text-xs text-muted-foreground mt-1">TikTok</div>
                      </div>
                    )}
                    {report.socialMedia?.youtube && (
                      <div className="text-center p-5 border rounded-xl hover:shadow-md transition-shadow">
                        <Youtube className="w-7 h-7 mx-auto text-[#FF0000]" />
                        <div className="text-xl font-bold mt-2">{(report.socialMedia.youtube.subscribers / 1000).toFixed(1)}K</div>
                        <div className="text-xs text-muted-foreground mt-1">YouTube</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Analysis */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4 text-orange-500" />风险分析
                    <Badge variant="outline" className="ml-2">{report.riskAnalysis?.overallRisk} Risk</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {report.riskAnalysis?.factors?.map((f: any, i: number) => (
                    <div key={i} className={`flex items-start gap-3 p-4 rounded-xl ${f.type === 'positive' ? 'bg-green-50 border border-green-100' : f.type === 'negative' ? 'bg-red-50 border border-red-100' : 'bg-muted border border-muted'}`}>
                      {f.type === 'positive' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      ) : f.type === 'negative' ? (
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      ) : (
                        <span className="w-5 h-5 shrink-0 mt-0.5 text-center text-base">ℹ</span>
                      )}
                      <div className="flex-1">
                        <span className="text-sm">{f.message}</span>
                        <div className="flex gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">来源: {f.source}</span>
                          {f.uncertainty && <span className="text-xs text-muted-foreground">({f.uncertainty})</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-3 italic">{report.riskAnalysis?.note}</p>
                </CardContent>
              </Card>

              {/* Contacts */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />关键联系人
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.contacts?.map((c: any, i: number) => (
                      <div key={i} className={`flex items-center justify-between p-5 rounded-xl border-2 ${c.recommended ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${c.recommended ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-semibold text-base flex items-center gap-2">
                              {c.name}
                              {c.recommended && <Badge className="bg-primary">推荐</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground mt-0.5">{c.title}</div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary">{c.priorityScore}</div>
                          <div className="text-xs text-muted-foreground mt-1">联系优先级</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Recommendation */}
              <Card className="shadow-sm border-2 border-primary">
                <CardHeader className="pb-4 bg-primary/5 rounded-t-xl">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />AI 开发建议
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-start gap-3">
                    <span className="font-semibold text-sm shrink-0 w-20">推荐优先级:</span>
                    <span className="text-green-600 font-bold text-lg">{report.recommendation?.priority}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-semibold text-sm shrink-0 w-20">理由:</span>
                    <span className="text-sm leading-relaxed">{report.recommendation?.reason}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-semibold text-sm shrink-0 w-20">建议行动:</span>
                    <span className="text-sm leading-relaxed">{report.recommendation?.recommendedAction}</span>
                  </div>
                  <div className="pt-2">
                    <Button asChild size="lg" className="px-6">
                      <a href={`/ai-outreach?customer=${encodeURIComponent(report.companyName)}`}>
                        <Send className="w-4 h-4 mr-2" />生成 AI 开发信
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">背调历史</CardTitle>
              <CardDescription>查看之前生成的客户情报报告</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {history.length === 0 ? (
                <div className="p-16 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <div className="text-muted-foreground">暂无背调报告</div>
                </div>
              ) : (
                <div className="divide-y">
                  {history.map((r) => (
                    <button key={r.id} onClick={() => loadReport(r.id)} className="w-full p-6 flex items-center justify-between hover:bg-muted/30 text-left transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Brain className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-base">{r.companyName}</div>
                          <div className="text-sm text-muted-foreground mt-1">{new Date(r.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                      <Badge variant={r.status === 'completed' ? 'default' : 'secondary'} className="text-sm px-3 py-1">{r.status}</Badge>
                    </button>
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
