import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Printer,
  Plus,
  Trash2,
  Upload,
  FileText,
  Package,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import DocumentPreview from './DocumentPreview';
import {
  documentsApi,
  DOCUMENT_TYPE_LABELS,
  type DocumentData,
  type DocumentItem,
  type SellerInfo,
  type BuyerInfo,
  type DocumentTerms,
  type BankInfo,
} from '@/api/documents';
import { listProducts, type Product } from '@/api/products';
import { uploadFile } from '@/utils/upload';

const emptySeller: SellerInfo = {
  companyName: '',
  email: '',
  tel: '',
  address: '',
  logo: '',
};

const emptyBuyer: BuyerInfo = {
  companyName: '',
  attn: '',
  address: '',
  tel: '',
  email: '',
};

const emptyTerms: DocumentTerms = {
  priceTerm: 'FOB Shanghai',
  paymentTerm: '30% TT deposit, 70% before shipment',
  deliveryTime: '25-35 days after deposit',
  port: 'Shenzhen / Shanghai',
  other: '',
};

const emptyBankInfo: BankInfo = {
  bankName: '',
  bankAddress: '',
  accountName: '',
  accountNumber: '',
  swiftCode: '',
  iban: '',
  routingNumber: '',
};

function createEmptyItem(): DocumentItem {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    image: '',
    description: '',
    specs: '',
    moq: 100,
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    cartons: 0,
    ctnSize: '',
    grossWeight: 0,
    netWeight: 0,
    cbm: 0,
    cbmPerUnit: 0,
    totalCbm: 0,
    remark: '',
  };
}

export default function DocumentEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSeal, setUploadingSeal] = useState(false);

  const [type, setType] = useState<DocumentData['type']>('quotation');
  const [documentNo, setDocumentNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [validity, setValidity] = useState('30 Days');
  const [currency, setCurrency] = useState('USD');
  const [seller, setSeller] = useState<SellerInfo>(emptySeller);
  const [buyer, setBuyer] = useState<BuyerInfo>(emptyBuyer);
  const [items, setItems] = useState<DocumentItem[]>([createEmptyItem()]);
  const [terms, setTerms] = useState<DocumentTerms>(emptyTerms);
  const [bankInfo, setBankInfo] = useState<BankInfo>(emptyBankInfo);
  const [notes, setNotes] = useState('');

  // Product picker
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productList, setProductList] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Load existing document
  useEffect(() => {
    if (!id) {
      // New document: load from cache
      try {
        const cached = localStorage.getItem('doc_cache');
        if (cached) {
          const data = JSON.parse(cached);
          if (data.validity) setValidity(data.validity);
          if (data.currency) setCurrency(data.currency);
          if (data.sellerInfo) setSeller(data.sellerInfo);
          if (data.terms) setTerms(data.terms);
        }
      } catch { /* ignore */ }
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const doc = await documentsApi.getById(Number(id));
        setType(doc.type);
        setDocumentNo(doc.documentNo);
        setDate(doc.date || '');
        setValidity(doc.validity || '');
        setCurrency(doc.currency || 'USD');
        setSeller(doc.sellerInfo || emptySeller);
        setBuyer(doc.buyerInfo || emptyBuyer);
        setItems(doc.items && doc.items.length > 0 ? doc.items : [createEmptyItem()]);
        setTerms(doc.terms || emptyTerms);
        setBankInfo(doc.bankInfo || emptyBankInfo);
        setNotes(doc.notes || '');
      } catch (err) {
        console.error('Load document failed:', err);
        toast.error('加载单证失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { url } = await uploadFile(file);
      setSeller((prev) => ({ ...prev, logo: url }));
      toast.success('Logo 上传成功');
    } catch {
      toast.error('Logo 上传失败');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSeal(true);
    try {
      const { url } = await uploadFile(file);
      setSeller((prev) => ({ ...prev, sealImage: url }));
      toast.success('印章上传成功');
    } catch {
      toast.error('印章上传失败');
    } finally {
      setUploadingSeal(false);
    }
  };

  const addItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => (prev.length <= 1 ? [createEmptyItem()] : prev.filter((i) => i.id !== itemId)));
  };

  const updateItem = (itemId: string, field: keyof DocumentItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
    );
  };

  const loadProducts = async (page = 1, search = '') => {
    setLoadingProducts(true);
    try {
      const res = await listProducts({ page, pageSize: 12, search: search || undefined });
      setProductList(res.items);
      setProductTotal(res.total);
      setProductPage(res.page);
    } catch {
      toast.error('加载产品列表失败');
    } finally {
      setLoadingProducts(false);
    }
  };

  const openProductPicker = () => {
    setProductSearch('');
    setProductPage(1);
    loadProducts(1, '');
    setShowProductPicker(true);
  };

  const selectProduct = (product: Product) => {
    const newItem: DocumentItem = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 10),
      image: product.imageUrl || '',
      description: `${product.name} (${product.itemNumber})`,
      specs: product.specifications ? Object.entries(product.specifications).map(([k, v]) => `${k}: ${v}`).join(', ') : '',
      moq: product.moq || 0,
      quantity: product.moq || 100,
      unitPrice: 0,
      discount: 0,
      cartons: 0,
      ctnSize: '',
      grossWeight: 0,
      netWeight: 0,
      cbm: 0,
      cbmPerUnit: 0,
      totalCbm: 0,
      remark: '',
    };
    setItems((prev) => {
      // Replace first empty item or append
      const emptyIdx = prev.findIndex((i) => !i.description.trim());
      if (emptyIdx >= 0) {
        const next = [...prev];
        next[emptyIdx] = newItem;
        return next;
      }
      return [...prev, newItem];
    });
    setShowProductPicker(false);
    toast.success(`已添加: ${product.name}`);
  };

  const handleItemImageUpload = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadFile(file);
      updateItem(itemId, 'image', url);
    } catch {
      toast.error('图片上传失败');
    }
  };

  const collectData = (): DocumentData => {
    const validItems = items.filter((i) => i.description.trim() !== '');
    const totalAmount = type === 'pl'
      ? '0'
      : validItems.reduce((sum, item) => {
          const qty = Number(item.quantity) || 0;
          const price = Number(item.unitPrice) || 0;
          return sum + qty * price;
        }, 0).toFixed(2);
    return {
      type,
      documentNo: documentNo || `${type.toUpperCase()}${Date.now()}`,
      date,
      validity,
      currency,
      sellerInfo: seller,
      buyerInfo: buyer,
      items: validItems,
      terms,
      bankInfo,
      notes,
      totalAmount,
    };
  };

  const handleSave = async () => {
    if (!documentNo.trim()) {
      toast.error('请填写单证编号');
      return;
    }
    setSaving(true);
    try {
      const data = collectData();
      // Cache common fields for next time
      try {
        localStorage.setItem('doc_cache', JSON.stringify({
          validity,
          currency,
          sellerInfo: seller,
          terms,
        }));
      } catch { /* ignore */ }
      if (isEdit && id) {
        await documentsApi.update(Number(id), data);
        toast.success('保存成功');
      } else {
        const created = await documentsApi.create(data);
        toast.success('创建成功');
        navigate(`/documents/${created.id}`, { replace: true });
      }
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const previewData: DocumentData = {
    type,
    documentNo,
    date,
    validity,
    currency,
    sellerInfo: seller,
    buyerInfo: buyer,
    items,
    terms,
    bankInfo,
    notes,
  };

  const isPL = type === 'pl';

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="no-print flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/documents')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">
              {isEdit ? '编辑单证' : '新建单证'}
            </h1>
            <p className="text-sm text-muted-foreground">
              左侧编辑信息，右侧实时预览
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={type} onValueChange={(v) => setType(v as DocumentData['type'])}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 size-4" />
            打印/PDF
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 size-4" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        {/* Left: Form */}
        <div className="no-print space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
          {/* Header Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">单证信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">单证编号</Label>
                  <Input value={documentNo} onChange={(e) => setDocumentNo(e.target.value)} placeholder="如 QT202608001" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">日期</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
              {!isPL && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">有效期</Label>
                    <Input value={validity} onChange={(e) => setValidity(e.target.value)} placeholder="如 30 Days" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">货币</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="RMB">RMB</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seller Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">卖方信息 SELLER</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded border bg-muted flex items-center justify-center">
                  {seller.logo ? (
                    <img src={seller.logo} alt="logo" className="h-full w-full object-contain" />
                  ) : (
                    <FileText className="size-5 text-muted-foreground/40" />
                  )}
                </div>
                <div>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('logo-upload')?.click()} disabled={uploadingLogo}>
                    <Upload className="mr-1 size-3" />
                    {uploadingLogo ? '上传中' : '上传Logo'}
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">公司名称</Label>
                <Input value={seller.companyName} onChange={(e) => setSeller({ ...seller, companyName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input value={seller.email} onChange={(e) => setSeller({ ...seller, email: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tel</Label>
                  <Input value={seller.tel} onChange={(e) => setSeller({ ...seller, tel: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">地址</Label>
                <Textarea value={seller.address} onChange={(e) => setSeller({ ...seller, address: e.target.value })} rows={2} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">公司印章（用于签名处）</Label>
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded border bg-muted flex items-center justify-center">
                    {seller.sealImage ? (
                      <img src={seller.sealImage} alt="seal" className="h-full w-full object-contain" />
                    ) : (
                      <FileText className="size-5 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input type="file" accept="image/*" onChange={handleSealUpload} className="hidden" id="seal-upload" />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('seal-upload')?.click()} disabled={uploadingSeal}>
                      <Upload className="mr-1 size-3" />
                      {uploadingSeal ? '上传中' : '上传印章'}
                    </Button>
                    {seller.sealImage && (
                      <Button variant="ghost" size="sm" onClick={() => setSeller({ ...seller, sealImage: '' })}>
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buyer Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">买方信息 BUYER</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">公司/客户名</Label>
                  <Input value={buyer.companyName} onChange={(e) => setBuyer({ ...buyer, companyName: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Attn</Label>
                  <Input value={buyer.attn} onChange={(e) => setBuyer({ ...buyer, attn: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">地址</Label>
                <Textarea value={buyer.address} onChange={(e) => setBuyer({ ...buyer, address: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tel</Label>
                  <Input value={buyer.tel} onChange={(e) => setBuyer({ ...buyer, tel: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">商品明细 ITEMS</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={openProductPicker}>
                  <Package className="mr-1 size-3" /> 从产品库选择
                </Button>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-1 size-3" /> 添加
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, idx) => (
                <div key={item.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">#{idx + 1}</Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(item.id)}>
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded border bg-muted flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <FileText className="size-4 text-muted-foreground/40" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id={`item-img-${item.id}`}
                      onChange={(e) => handleItemImageUpload(item.id, e)}
                    />
                    <Button variant="outline" size="sm" className="h-8" onClick={() => document.getElementById(`item-img-${item.id}`)?.click()}>
                      <Upload className="mr-1 size-3" /> 图片
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} placeholder="产品描述/货号" />
                  </div>
                  {!isPL && (
                    <div className="space-y-1">
                      <Label className="text-xs">Specs</Label>
                      <Input value={item.specs} onChange={(e) => updateItem(item.id, 'specs', e.target.value)} />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input type="number" value={item.quantity} onChange={(e) => {
                        const qty = Number(e.target.value);
                        updateItem(item.id, 'quantity', qty);
                        if (item.cbmPerUnit) {
                          updateItem(item.id, 'totalCbm', Number((qty * Number(item.cbmPerUnit)).toFixed(4)));
                        }
                      }} />
                    </div>
                    {!isPL ? (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs">CBM/CTN</Label>
                          <Input type="number" step="0.0001" value={item.cbmPerUnit} onChange={(e) => {
                            const cbm = Number(e.target.value);
                            updateItem(item.id, 'cbmPerUnit', cbm);
                            if (item.quantity) {
                              updateItem(item.id, 'totalCbm', Number((item.quantity * cbm).toFixed(4)));
                            }
                          }} placeholder="单箱体积" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Total CBM</Label>
                          <Input type="number" step="0.0001" value={item.totalCbm} onChange={(e) => updateItem(item.id, 'totalCbm', Number(e.target.value))} placeholder="总体积" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Unit Price</Label>
                          <Input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs">CTNs</Label>
                          <Input type="number" value={item.cartons} onChange={(e) => updateItem(item.id, 'cartons', Number(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">CTN Size</Label>
                          <Input value={item.ctnSize} onChange={(e) => updateItem(item.id, 'ctnSize', e.target.value)} placeholder="如 40x30x25" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">G.W(kg)</Label>
                          <Input type="number" step="0.01" value={item.grossWeight} onChange={(e) => updateItem(item.id, 'grossWeight', Number(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">N.W(kg)</Label>
                          <Input type="number" step="0.01" value={item.netWeight} onChange={(e) => updateItem(item.id, 'netWeight', Number(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">CBM</Label>
                          <Input type="number" step="0.001" value={item.cbm} onChange={(e) => updateItem(item.id, 'cbm', Number(e.target.value))} />
                        </div>
                      </>
                    )}
                  </div>
                  {!isPL && (
                    <div className="space-y-1">
                      <Label className="text-xs">Remark</Label>
                      <Input value={item.remark} onChange={(e) => updateItem(item.id, 'remark', e.target.value)} placeholder="备注信息" />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Terms */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">条款 TERMS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">价格条款 Price Term</Label>
                <Input value={terms.priceTerm} onChange={(e) => setTerms({ ...terms, priceTerm: e.target.value })} placeholder="如 FOB Shanghai" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">付款方式 Payment Term</Label>
                <Input value={terms.paymentTerm} onChange={(e) => setTerms({ ...terms, paymentTerm: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">交期 Delivery Time</Label>
                <Input value={terms.deliveryTime} onChange={(e) => setTerms({ ...terms, deliveryTime: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">港口 Port</Label>
                <Input value={terms.port} onChange={(e) => setTerms({ ...terms, port: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">其他条款</Label>
                <Textarea value={terms.other} onChange={(e) => setTerms({ ...terms, other: e.target.value })} rows={2} />
              </div>
            </CardContent>
          </Card>

          {/* Bank Info - shown for PI and CI */}
          {(type === 'pi' || type === 'ci') && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">银行账户信息 BANK INFO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">银行名称 Bank Name</Label>
                  <Input value={bankInfo.bankName} onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })} placeholder="如 HSBC Hong Kong" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">银行地址 Bank Address</Label>
                  <Textarea value={bankInfo.bankAddress} onChange={(e) => setBankInfo({ ...bankInfo, bankAddress: e.target.value })} rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">账户名 Account Name</Label>
                    <Input value={bankInfo.accountName} onChange={(e) => setBankInfo({ ...bankInfo, accountName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">账号 Account No.</Label>
                    <Input value={bankInfo.accountNumber} onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">SWIFT Code</Label>
                    <Input value={bankInfo.swiftCode} onChange={(e) => setBankInfo({ ...bankInfo, swiftCode: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">IBAN</Label>
                    <Input value={bankInfo.iban} onChange={(e) => setBankInfo({ ...bankInfo, iban: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Routing Number (USD)</Label>
                  <Input value={bankInfo.routingNumber} onChange={(e) => setBankInfo({ ...bankInfo, routingNumber: e.target.value })} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">备注 NOTES</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="其他备注信息..." />
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview */}
        <div className="print-area">
          <div className="sticky top-4 rounded-lg border bg-gray-100 p-4 shadow-sm">
            <div className="no-print mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">实时预览</span>
              <Badge variant="outline">{DOCUMENT_TYPE_LABELS[type]}</Badge>
            </div>
            <div className="max-h-[calc(100vh-220px)] overflow-auto rounded bg-white p-8 shadow">
              <DocumentPreview data={previewData} />
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { margin: 10mm; size: A4; background: white; }
          html, body { overflow: visible !important; height: auto !important; background: white !important; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; height: auto !important; background: white !important; }
          .print-area .sticky { position: static !important; box-shadow: none !important; border: none !important; padding: 0 !important; background: white !important; }
          .print-area > div > div:last-child { max-height: none !important; overflow: visible !important; padding: 0 !important; box-shadow: none !important; border-radius: 0 !important; background: white !important; }
          .print-area .document-preview { padding: 0 !important; max-width: 100% !important; background: white !important; }
          .print-area table { table-layout: auto !important; width: 100% !important; }
          .print-area img { object-fit: contain !important; }
          .print-area * { background-color: transparent !important; }
          .print-area thead tr { background-color: #1F4E78 !important; }
          .print-area tbody tr:nth-child(even) { background-color: #f9fafb !important; }
          .print-area tfoot tr { background-color: transparent !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* Product Picker Dialog */}
      <Dialog open={showProductPicker} onOpenChange={setShowProductPicker}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>从产品库选择</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="搜索产品名称或货号..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadProducts(1, productSearch)}
              />
            </div>
            <Button onClick={() => loadProducts(1, productSearch)}>搜索</Button>
          </div>
          <div className="flex-1 overflow-auto">
            {loadingProducts ? (
              <div className="py-12 text-center text-muted-foreground">加载中...</div>
            ) : productList.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">暂无产品</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {productList.map((product) => (
                  <div
                    key={product.id}
                    className="text-left rounded-lg border p-3 hover:border-[#1F4E78] hover:shadow-md transition-all"
                  >
                    <div className="aspect-square rounded bg-muted mb-2 overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                          <Package className="size-8" />
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-medium line-clamp-2">{product.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">货号: {product.itemNumber}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">MOQ: {product.moq}</span>
                      <Button size="sm" className="h-7 px-3 text-xs bg-[#1F4E78] hover:bg-[#1a3a5c]" onClick={() => selectProduct(product)}>
                        选择
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {productTotal > 12 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-xs text-muted-foreground">共 {productTotal} 个产品</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={productPage <= 1}
                  onClick={() => loadProducts(productPage - 1, productSearch)}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={productPage * 12 >= productTotal}
                  onClick={() => loadProducts(productPage + 1, productSearch)}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
