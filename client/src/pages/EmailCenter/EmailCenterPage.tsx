import { useState, useEffect } from 'react';
import { Mail, Inbox, Send, RefreshCw, Plus, Trash2, Check, Sparkles, Loader2, Inbox as InboxIcon, Send as SendIcon, Tag, User, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import http from '@/utils/http';

interface EmailAccount {
  id: number;
  name: string;
  email: string;
  provider: string;
  isActive: boolean;
  lastSyncAt: string | null;
}

interface EmailMessage {
  id: number;
  accountId: number;
  direction: 'inbound' | 'outbound';
  subject: string;
  fromName: string;
  fromEmail: string;
  toEmail: string[];
  bodyText: string;
  isRead: boolean;
  aiCategory: string;
  aiSummary: string;
  aiDraftReply: string;
  receivedAt: string | null;
  sentAt: string | null;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  interested: { label: '有兴趣', color: 'text-green-700', bg: 'bg-green-100' },
  price_request: { label: '询价', color: 'text-blue-700', bg: 'bg-blue-100' },
  sample_request: { label: '要样品', color: 'text-purple-700', bg: 'bg-purple-100' },
  not_interested: { label: '没兴趣', color: 'text-gray-600', bg: 'bg-gray-100' },
  have_supplier: { label: '已有供应商', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  follow_up_later: { label: '稍后跟进', color: 'text-orange-700', bg: 'bg-orange-100' },
  no_response: { label: '未回复', color: 'text-gray-500', bg: 'bg-gray-100' },
  uncategorized: { label: '未分类', color: 'text-gray-500', bg: 'bg-gray-100' },
};

export default function EmailCenterPage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', email: '', provider: 'smtp' as 'gmail' | 'outlook' | 'smtp', smtpHost: '', smtpPort: 587, username: '', password: '' });
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const loadAccounts = async () => {
    try {
      const res = await http.get('/api/email-center/accounts');
      setAccounts(res.data.items || []);
    } catch {}
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === 'inbox') params.set('direction', 'inbound');
      if (activeTab === 'sent') params.set('direction', 'outbound');
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      const res = await http.get(`/api/email-center/messages?${params.toString()}`);
      setMessages(res.data.items || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAccounts(); }, []);
  useEffect(() => { loadMessages(); }, [activeTab, categoryFilter]);

  const addAccount = async () => {
    try {
      await http.post('/api/email-center/accounts', newAccount);
      setShowAddAccount(false);
      setNewAccount({ name: '', email: '', provider: 'smtp', smtpHost: '', smtpPort: 587, username: '', password: '' });
      loadAccounts();
    } catch (e) {
      alert('添加失败');
    }
  };

  const syncEmails = async (accountId: number) => {
    setSyncing(true);
    try {
      await http.post(`/api/email-center/accounts/${accountId}/sync`);
      loadMessages();
      loadAccounts();
    } catch (e) {
      alert('同步失败');
    } finally {
      setSyncing(false);
    }
  };

  const openMessage = async (msg: EmailMessage) => {
    setSelectedMessage(msg);
    setReplyText(msg.aiDraftReply || '');
    if (!msg.isRead) {
      try {
        await http.put(`/api/email-center/messages/${msg.id}/read`);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
      } catch {}
    }
  };

  const sendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    setSending(true);
    try {
      await http.post('/api/email-center/messages/send', { accountId: selectedMessage.accountId, toEmail: selectedMessage.fromEmail, subject: `Re: ${selectedMessage.subject}`, body: replyText, threadId: (selectedMessage as any).threadId });
      alert('回复已发送');
      setSelectedMessage(null);
      loadMessages();
    } catch (e) {
      alert('发送失败');
    } finally {
      setSending(false);
    }
  };

  const reanalyze = async (id: number) => {
    try {
      const res = await http.post(`/api/email-center/messages/${id}/reanalyze`);
      setSelectedMessage(prev => prev ? { ...prev, aiCategory: res.data.category, aiSummary: res.data.summary, aiDraftReply: res.data.draftReply } : prev);
      setReplyText(res.data.draftReply);
    } catch {}
  };

  const inboundCount = messages.filter(m => m.direction === 'inbound').length;
  const unreadCount = messages.filter(m => !m.isRead && m.direction === 'inbound').length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">邮箱管理中心</h1>
          </div>
          <p className="text-muted-foreground text-base">连接邮箱，AI 自动分类客户回复并生成建议回复</p>
        </div>
        <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
          <DialogTrigger asChild>
            <Button size="lg" className="h-11 px-6">
              <Plus className="w-4 h-4 mr-2" />添加邮箱
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">添加邮箱账户</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">账户名称</Label>
                <Input value={newAccount.name} onChange={e => setNewAccount({ ...newAccount, name: e.target.value })} placeholder="我的工作邮箱" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">邮箱地址</Label>
                <Input value={newAccount.email} onChange={e => setNewAccount({ ...newAccount, email: e.target.value })} placeholder="sales@yourcompany.com" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">邮箱类型</Label>
                <Select value={newAccount.provider} onValueChange={(v: any) => setNewAccount({ ...newAccount, provider: v })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smtp">自定义 SMTP</SelectItem>
                    <SelectItem value="gmail">Gmail</SelectItem>
                    <SelectItem value="outlook">Outlook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newAccount.provider === 'smtp' && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">SMTP 服务器</Label>
                      <Input value={newAccount.smtpHost} onChange={e => setNewAccount({ ...newAccount, smtpHost: e.target.value })} placeholder="smtp.example.com" className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">端口</Label>
                      <Input type="number" value={newAccount.smtpPort} onChange={e => setNewAccount({ ...newAccount, smtpPort: Number(e.target.value) })} className="h-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">用户名</Label>
                    <Input value={newAccount.username} onChange={e => setNewAccount({ ...newAccount, username: e.target.value })} className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">密码/授权码</Label>
                    <Input type="password" value={newAccount.password} onChange={e => setNewAccount({ ...newAccount, password: e.target.value })} className="h-10" />
                  </div>
                </div>
              )}
              <Button onClick={addAccount} className="w-full h-11 text-base">保存账户</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-5">
            <div className="text-3xl font-bold text-blue-600">{accounts.length}</div>
            <div className="text-sm text-muted-foreground mt-1">邮箱账户</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-5">
            <div className="text-3xl font-bold text-green-600">{inboundCount}</div>
            <div className="text-sm text-muted-foreground mt-1">收件箱</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-5">
            <div className="text-3xl font-bold text-orange-600">{unreadCount}</div>
            <div className="text-sm text-muted-foreground mt-1">未读邮件</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-5">
            <div className="text-3xl font-bold text-purple-600">{messages.filter(m => m.aiCategory !== 'uncategorized').length}</div>
            <div className="text-sm text-muted-foreground mt-1">AI 已分类</div>
          </CardContent>
        </Card>
      </div>

      {/* Email Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts.map(acc => (
          <Card key={acc.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-base">{acc.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{acc.email}</div>
                  </div>
                </div>
                <Badge variant={acc.isActive ? 'default' : 'secondary'} className="text-xs">{acc.provider}</Badge>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Button size="sm" variant="outline" onClick={() => syncEmails(acc.id)} disabled={syncing} className="h-9 px-4">
                  {syncing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
                  同步邮件
                </Button>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {acc.lastSyncAt ? new Date(acc.lastSyncAt).toLocaleTimeString() : '未同步'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        {accounts.length === 0 && (
          <Card className="md:col-span-3 shadow-sm">
            <CardContent className="p-12 text-center">
              <Mail className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground text-base">暂无邮箱账户，点击右上角添加</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Email List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Email List */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">邮件列表</CardTitle>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full rounded-none border-b h-11">
                <TabsTrigger value="inbox" className="flex-1 text-sm">
                  <InboxIcon className="w-4 h-4 mr-1.5" />收件箱
                  {unreadCount > 0 && <Badge className="ml-2 text-xs">{unreadCount}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex-1 text-sm">
                  <SendIcon className="w-4 h-4 mr-1.5" />已发送
                </TabsTrigger>
              </TabsList>
              <TabsContent value="inbox" className="m-0">
                <div className="divide-y max-h-[550px] overflow-y-auto">
                  {loading ? (
                    <div className="p-12 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" /></div>
                  ) : messages.length === 0 ? (
                    <div className="p-12 text-center text-sm text-muted-foreground">
                      <InboxIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                      暂无邮件
                    </div>
                  ) : (
                    messages.map(msg => (
                      <button
                        key={msg.id}
                        onClick={() => openMessage(msg)}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${selectedMessage?.id === msg.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'} ${!msg.isRead ? 'bg-blue-50/30' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${!msg.isRead ? 'font-semibold' : ''}`}>{msg.fromName || msg.fromEmail}</span>
                          {CATEGORY_LABELS[msg.aiCategory] && (
                            <Badge className={`${CATEGORY_LABELS[msg.aiCategory].bg} ${CATEGORY_LABELS[msg.aiCategory].color} border-0 text-[10px] px-2 py-0.5 shrink-0`}>
                              {CATEGORY_LABELS[msg.aiCategory].label}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs truncate text-muted-foreground mt-1.5">{msg.subject}</div>
                        <div className="text-xs truncate text-muted-foreground/70 mt-1">{msg.aiSummary}</div>
                      </button>
                    ))
                  )}
                </div>
              </TabsContent>
              <TabsContent value="sent" className="m-0">
                <div className="divide-y max-h-[550px] overflow-y-auto">
                  {messages.filter(m => m.direction === 'outbound').length === 0 ? (
                    <div className="p-12 text-center text-sm text-muted-foreground">
                      <SendIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                      暂无已发送邮件
                    </div>
                  ) : (
                    messages.filter(m => m.direction === 'outbound').map(msg => (
                      <button
                        key={msg.id}
                        onClick={() => openMessage(msg)}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${selectedMessage?.id === msg.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                      >
                        <div className="text-sm truncate font-medium">To: {msg.toEmail?.join(', ')}</div>
                        <div className="text-xs truncate text-muted-foreground mt-1.5">{msg.subject}</div>
                      </button>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Email Detail */}
        <Card className="lg:col-span-3 shadow-sm">
          {selectedMessage ? (
            <div className="flex flex-col h-full">
              <CardHeader className="pb-5 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl leading-tight">{selectedMessage.subject}</CardTitle>
                    <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {selectedMessage.direction === 'inbound'
                        ? `来自: ${selectedMessage.fromName} <${selectedMessage.fromEmail}>`
                        : `发送给: ${selectedMessage.toEmail?.join(', ')}`}
                    </div>
                  </div>
                  {selectedMessage.direction === 'inbound' && (
                    <Button size="sm" variant="outline" onClick={() => reanalyze(selectedMessage.id)} className="h-9 px-4 shrink-0">
                      <Sparkles className="w-4 h-4 mr-1.5" />重新AI分析
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-6 pt-6">
                {/* AI Category */}
                {selectedMessage.aiCategory !== 'uncategorized' && (
                  <div className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold">AI 分类: {CATEGORY_LABELS[selectedMessage.aiCategory]?.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedMessage.aiSummary}</p>
                  </div>
                )}

                {/* Email Body */}
                <div>
                  <div className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />邮件内容
                  </div>
                  <div className="p-5 border rounded-xl text-sm whitespace-pre-wrap max-h-[250px] overflow-y-auto leading-relaxed bg-muted/20">
                    {selectedMessage.bodyText}
                  </div>
                </div>

                {/* AI Draft Reply */}
                {selectedMessage.direction === 'inbound' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-500" />AI 建议回复
                        <span className="text-xs text-muted-foreground font-normal">（需确认后发送）</span>
                      </span>
                    </div>
                    <Textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      className="min-h-[180px] text-sm leading-relaxed p-5"
                      placeholder="AI 生成的建议回复..."
                    />
                    <div className="flex items-center gap-3">
                      <Button onClick={sendReply} disabled={sending} size="lg" className="px-6 h-11">
                        {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        确认并发送
                      </Button>
                      <Button variant="outline" onClick={() => setReplyText(selectedMessage.aiDraftReply || '')} size="lg" className="px-6 h-11">
                        恢复AI建议
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
          ) : (
            <CardContent className="p-16 text-center">
              <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground text-base">选择一封邮件查看详情</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
