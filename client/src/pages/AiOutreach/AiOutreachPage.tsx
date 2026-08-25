import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Mail, Linkedin, Facebook, MessageCircle, Copy, Check, Loader2, Calendar, Target, Sparkles, Rocket, Clock, Zap, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import http from '@/utils/http';

const PRODUCT_OPTIONS = ['Bubble Toys', 'RC Toys', 'Building Blocks', 'Beach Toys'];
const COUNTRY_OPTIONS = ['Saudi Arabia', 'UAE', 'Vietnam', 'Brazil', 'Chile', 'Poland', 'Mexico', 'Malaysia', 'USA'];

interface OutreachResult {
  id: number;
  strategy: any;
  coldEmail: any;
  linkedinMessage: string;
  facebookMessage: string;
  whatsappMessage: string;
}

export default function AiOutreachPage() {
  const [searchParams] = useSearchParams();
  const [customerName, setCustomerName] = useState(searchParams.get('customer') || '');
  const [productName, setProductName] = useState('Bubble Toys');
  const [targetCountry, setTargetCountry] = useState(searchParams.get('country') || 'Saudi Arabia');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OutreachResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const generate = async () => {
    if (!customerName.trim()) {
      alert('请输入客户名称');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await http.post('/api/ai-outreach/generate', { customerName, productName, targetCountry });
      setResult(res.data);
      loadHistory();
    } catch (e) {
      alert('生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await http.get('/api/ai-outreach');
      setHistory(res.data.items || []);
    } catch {}
  };

  useEffect(() => { loadHistory(); }, []);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">AI 自主开发</h1>
        </div>
        <p className="text-muted-foreground text-base">AI 根据客户信息个性化生成开发策略和多渠道触达文案</p>
      </div>

      {/* Parameters Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Target className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">开发参数</CardTitle>
              <CardDescription className="mt-1">填写客户和产品信息，AI 将生成个性化开发方案</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">客户名称 <span className="text-red-500">*</span></Label>
              <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="客户公司名称" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">产品</Label>
              <Select value={productName} onValueChange={setProductName}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{PRODUCT_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">目标国家</Label>
              <Select value={targetCountry} onValueChange={setTargetCountry}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{COUNTRY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="pt-2">
            <Button onClick={generate} disabled={loading} size="lg" className="px-8 h-12 text-base">
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
              {loading ? 'AI 生成中...' : '生成开发策略和文案'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-8">
          {/* Strategy Card */}
          <Card className="shadow-sm border-l-4 border-l-orange-500">
            <CardHeader className="pb-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" />客户开发策略
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-muted/30 rounded-xl">
                  <div className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />客户画像
                  </div>
                  <div className="text-sm font-medium leading-relaxed">{result.strategy?.customerProfile}</div>
                </div>
                <div className="p-5 bg-muted/30 rounded-xl">
                  <div className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />价值主张
                  </div>
                  <div className="text-sm leading-relaxed">{result.strategy?.valueProposition}</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />21天跟进计划
                </div>
                <div className="space-y-3">
                  {result.strategy?.followUpSchedule?.map((step: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                      <Badge variant="outline" className="px-3 py-1.5 text-sm font-semibold shrink-0">Day {step.day}</Badge>
                      <Badge className="shrink-0">{step.channel}</Badge>
                      <span className="text-sm">{step.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Multi-channel Copy */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-500" />多渠道触达文案
              </CardTitle>
              <CardDescription className="mt-1">根据客户信息个性化生成，可直接复制使用</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="email" className="space-y-6">
                <TabsList className="h-11">
                  <TabsTrigger value="email" className="px-5"><Mail className="w-4 h-4 mr-2" />开发邮件</TabsTrigger>
                  <TabsTrigger value="linkedin" className="px-5"><Linkedin className="w-4 h-4 mr-2" />LinkedIn</TabsTrigger>
                  <TabsTrigger value="whatsapp" className="px-5"><MessageCircle className="w-4 h-4 mr-2" />WhatsApp</TabsTrigger>
                  <TabsTrigger value="facebook" className="px-5"><Facebook className="w-4 h-4 mr-2" />Facebook</TabsTrigger>
                </TabsList>

                <TabsContent value="email">
                  <Card className="border-0 shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 px-0">
                      <CardTitle className="text-base">Cold Email</CardTitle>
                      <Button size="sm" variant="outline" onClick={() => copyText(`Subject: ${result.coldEmail?.subject}\n\n${result.coldEmail?.body}`, 'email')} className="h-9 px-4">
                        {copied === 'email' ? <Check className="w-4 h-4 mr-1.5 text-green-500" /> : <Copy className="w-4 h-4 mr-1.5" />}
                        {copied === 'email' ? '已复制' : '复制全文'}
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-5 px-0 pb-0">
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="text-xs text-blue-600 mb-1 font-medium">Subject</div>
                        <div className="font-semibold text-base">{result.coldEmail?.subject}</div>
                      </div>
                      <Textarea value={result.coldEmail?.body} readOnly className="min-h-[350px] font-mono text-sm leading-relaxed p-5" />
                      <div>
                        <div className="text-xs text-muted-foreground mb-2 font-medium">个性化要点</div>
                        <div className="flex flex-wrap gap-2">
                          {result.coldEmail?.personalizationPoints?.map((p: string, i: number) => (
                            <Badge key={i} variant="secondary" className="px-3 py-1.5">{p}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="linkedin">
                  <Card className="border-0 shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 px-0">
                      <CardTitle className="text-base">LinkedIn 消息</CardTitle>
                      <Button size="sm" variant="outline" onClick={() => copyText(result.linkedinMessage || '', 'linkedin')} className="h-9 px-4">
                        {copied === 'linkedin' ? <Check className="w-4 h-4 mr-1.5 text-green-500" /> : <Copy className="w-4 h-4 mr-1.5" />}
                        {copied === 'linkedin' ? '已复制' : '复制'}
                      </Button>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                      <Textarea value={result.linkedinMessage} readOnly className="min-h-[200px] text-sm leading-relaxed p-5" />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="whatsapp">
                  <Card className="border-0 shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 px-0">
                      <CardTitle className="text-base">WhatsApp 消息</CardTitle>
                      <Button size="sm" variant="outline" onClick={() => copyText(result.whatsappMessage || '', 'whatsapp')} className="h-9 px-4">
                        {copied === 'whatsapp' ? <Check className="w-4 h-4 mr-1.5 text-green-500" /> : <Copy className="w-4 h-4 mr-1.5" />}
                        {copied === 'whatsapp' ? '已复制' : '复制'}
                      </Button>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                      <Textarea value={result.whatsappMessage} readOnly className="min-h-[180px] text-sm leading-relaxed p-5" />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="facebook">
                  <Card className="border-0 shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 px-0">
                      <CardTitle className="text-base">Facebook 消息</CardTitle>
                      <Button size="sm" variant="outline" onClick={() => copyText(result.facebookMessage || '', 'facebook')} className="h-9 px-4">
                        {copied === 'facebook' ? <Check className="w-4 h-4 mr-1.5 text-green-500" /> : <Copy className="w-4 h-4 mr-1.5" />}
                        {copied === 'facebook' ? '已复制' : '复制'}
                      </Button>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                      <Textarea value={result.facebookMessage} readOnly className="min-h-[180px] text-sm leading-relaxed p-5" />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-gray-500" />历史生成
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {history.slice(0, 5).map((h: any) => (
                <div key={h.id} className="p-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Rocket className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-base">{h.customerName}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{h.productName} · {h.targetCountry}</div>
                    </div>
                  </div>
                  <Badge variant={h.status === 'sent' ? 'default' : 'secondary'} className="text-sm px-3 py-1">{h.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
