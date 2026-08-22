import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Trash2, Edit2, Printer, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { documentsApi, DOCUMENT_TYPE_LABELS, type DocumentData } from '@/api/documents';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  sent: '已发送',
  confirmed: '已确认',
};

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await documentsApi.getAll();
      setDocuments(data);
    } catch (err) {
      console.error('Load documents failed:', err);
      toast.error('加载单证列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await documentsApi.delete(id);
      toast.success('删除成功');
      loadDocuments();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('删除失败');
    }
  };

  const filtered = documents.filter((doc) => {
    if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
    if (search.trim()) {
      const kw = search.toLowerCase();
      return (
        doc.documentNo.toLowerCase().includes(kw) ||
        doc.buyerInfo?.companyName?.toLowerCase().includes(kw) ||
        doc.sellerInfo?.companyName?.toLowerCase().includes(kw)
      );
    }
    return true;
  });

  const stats = {
    total: documents.length,
    quotation: documents.filter((d) => d.type === 'quotation').length,
    pi: documents.filter((d) => d.type === 'pi').length,
    ci: documents.filter((d) => d.type === 'ci').length,
    pl: documents.filter((d) => d.type === 'pl').length,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">单证管理</h1>
          <p className="text-sm text-muted-foreground">
            报价单、形式发票、商业发票、装箱单生成与管理
          </p>
        </div>
        <Button onClick={() => navigate('/documents/new')}>
          <Plus className="mr-2 size-4" />
          新建单证
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">全部</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">报价单</p>
            <p className="text-2xl font-bold text-orange-600">{stats.quotation}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">形式发票 PI</p>
            <p className="text-2xl font-bold text-blue-600">{stats.pi}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">商业发票 CI</p>
            <p className="text-2xl font-bold text-green-600">{stats.ci}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">装箱单 PL</p>
            <p className="text-2xl font-bold text-purple-600">{stats.pl}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">单证列表</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索单号/客户名..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 pl-8"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="quotation">报价单</SelectItem>
                  <SelectItem value="pi">形式发票</SelectItem>
                  <SelectItem value="ci">商业发票</SelectItem>
                  <SelectItem value="pl">装箱单</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-3 size-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">暂无单证数据</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/documents/new')}>
                <Plus className="mr-1 size-3" /> 创建第一个单证
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>单证编号</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc) => (
                  <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/documents/${doc.id}`)}>
                    <TableCell className="font-medium">{doc.documentNo}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{DOCUMENT_TYPE_LABELS[doc.type]}</Badge>
                    </TableCell>
                    <TableCell>{doc.buyerInfo?.companyName || '-'}</TableCell>
                    <TableCell>{doc.date || '-'}</TableCell>
                    <TableCell className="font-medium">
                      {doc.type === 'pl' || !doc.totalAmount || Number(doc.totalAmount) === 0
                        ? '-'
                        : `${doc.currency} ${Number(doc.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[doc.status || 'draft']}`}>
                        {STATUS_LABELS[doc.status || 'draft']}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/documents/${doc.id}`)}>
                          <Edit2 className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/documents/${doc.id}`)}>
                          <Printer className="size-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要删除单证 {doc.documentNo} 吗？此操作不可撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(doc.id!)}>删除</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
