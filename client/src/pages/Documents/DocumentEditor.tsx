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
  PenLine,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
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
  const [uploadingSignature, setUploadingSignature] = useState(false);

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
  const [shippingMark, setShippingMark] = useState('');
  const [showRemark, setShowRemark] = useState(false);
  const [showTotal, setShowTotal] = useState(() => localStorage.getItem('doc_showTotal') !== '0');
  // Quick price calculator defaults
  const [profitFactor, setProfitFactor] = useState(() => parseFloat(localStorage.getItem('qp_profitFactor') || '1.13'));
  const [fobCost, setFobCost] = useState(() => parseFloat(localStorage.getItem('qp_fobCost') || '8000'));
  const [containerCBM, setContainerCBM] = useState(() => parseFloat(localStorage.getItem('qp_containerCBM') || '67'));
  const [exchangeRate, setExchangeRate] = useState(() => parseFloat(localStorage.getItem('qp_exchangeRate') || '6.7'));
  const [printLandscape, setPrintLandscape] = useState(true);

  // Product picker
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productList, setProductList] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

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
        setShippingMark(doc.shippingMark || '');
      } catch (err) {
        console.error('Load document failed:', err);
        toast.error('加载单证失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Auto-generate document number for new docs: LVC + YYYYMMDD + 4 random digits
  useEffect(() => {
    if (!id && !documentNo) {
      const now = new Date();
      const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      setDocumentNo(`LVC${ymd}${rand}`);
    }
  }, [id, documentNo]);

  // Recalculate all items with costPrice when calculator settings change
  useEffect(() => {
    setItems((prev) => prev.map((item) => {
      if (!item.costPrice) return item;
      const pcs = parsePcsFromSpecs(item.specs || '');
      const price = calcPrice(item.costPrice, Number(item.cbmPerUnit) || 0, pcs);
      return { ...item, unitPrice: price };
    }));
  }, [profitFactor, fobCost, containerCBM, exchangeRate, currency]);

  // Persist quick price settings
  useEffect(() => {
    localStorage.setItem('qp_profitFactor', String(profitFactor));
    localStorage.setItem('qp_fobCost', String(fobCost));
    localStorage.setItem('qp_containerCBM', String(containerCBM));
    localStorage.setItem('qp_exchangeRate', String(exchangeRate));
  }, [profitFactor, fobCost, containerCBM, exchangeRate]);

  useEffect(() => {
    localStorage.setItem('doc_showTotal', showTotal ? '1' : '0');
  }, [showTotal]);

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
      e.target.value = '';
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
      e.target.value = '';
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSignature(true);
    try {
      const { url } = await uploadFile(file);
      setSeller((prev) => ({ ...prev, signatureImage: url }));
      toast.success('签名上传成功');
    } catch {
      toast.error('签名上传失败');
    } finally {
      setUploadingSignature(false);
      e.target.value = '';
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
    setSelectedProducts([]);
    loadProducts(1, '');
    setShowProductPicker(true);
  };

  const toggleSelectProduct = (product: Product) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);
      return [...prev, product];
    });
  };

  // Parse pieces-per-carton from specs object or string
  const parsePcsPerCtn = (specs: Record<string, unknown> | undefined, specStr: string): number => {
    // First try direct key lookup
    if (specs) {
      for (const [k, v] of Object.entries(specs)) {
        if (/pcs\/carton/i.test(k)) {
          const n = parseFloat(String(v));
          if (!isNaN(n) && n > 0) return n;
        }
      }
    }
    // Fallback: parse from string like "60pcs" or "24pcs*18boxes"
    if (!specStr) return 0;
    const m = specStr.match(/Spec:\s*([^,]+)/i);
    const specVal = m ? m[1] : specStr;
    const nums = specVal.match(/(\d+)\s*(pcs|boxes|bags|ctn)/gi);
    if (!nums) return 0;
    const values = nums.map((n) => parseInt(n.match(/\d+/)?.[0] || '0', 10));
    return values.reduce((a, b) => a * b, 1);
  };

  // Parse carton size like "97.5*53*52.5cm" → CBM in m³
  const parseCartonCbm = (specs: Record<string, unknown> | undefined): number => {
    if (!specs) return 0;
    for (const [k, v] of Object.entries(specs)) {
      if (/carton\s*size/i.test(k)) {
        const dims = String(v).match(/(\d+\.?\d*)\s*[*x×]\s*(\d+\.?\d*)\s*[*x×]\s*(\d+\.?\d*)/i);
        if (dims) {
          const l = parseFloat(dims[1]) / 100;
          const w = parseFloat(dims[2]) / 100;
          const h = parseFloat(dims[3]) / 100;
          return Math.round(l * w * h * 10000) / 10000;
        }
      }
    }
    return 0;
  };

  const buildItemFromProduct = (product: Product): DocumentItem => {
    const specsObj = (product.specifications || {}) as Record<string, unknown>;
    const specsStr = product.specifications
      ? Object.entries(product.specifications).map(([k, v]) => `${k}: ${v}`).join(', ')
      : '';
    const pcsPerCtn = parsePcsPerCtn(specsObj, specsStr);
    const cbmPerUnit = parseCartonCbm(specsObj);
    // Extract package size from specs
    let ctnSize = '';
    for (const [k, v] of Object.entries(specsObj)) {
      if (/package size/i.test(k)) { ctnSize = String(v); break; }
    }
    const moq = product.moq || 0;
    // Convert pcs MOQ to cartons
    const cartons = pcsPerCtn > 0 ? Math.round(moq / pcsPerCtn) : 0;
    const quantity = cartons || moq;
    // Specs field: only show Pcs/Carton value with "pcs" unit
    let specsDisplay = '';
    if (pcsPerCtn > 0) {
      // Check if the raw value already has a unit
      let rawVal = '';
      for (const [k, v] of Object.entries(specsObj)) {
        if (/pcs\/carton/i.test(k)) { rawVal = String(v); break; }
      }
      specsDisplay = /pcs/i.test(rawVal) ? rawVal : `${pcsPerCtn}pcs`;
    }
    return {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 10),
      image: product.imageUrl || '',
      description: `${product.name} (${product.itemNumber})`,
      specs: specsDisplay,
      moq,
      quantity,
      unitPrice: 0,
      discount: 0,
      cartons: quantity,
      ctnSize,
      grossWeight: 0,
      netWeight: 0,
      cbm: Math.round(quantity * cbmPerUnit * 10000) / 10000,
      cbmPerUnit,
      totalCbm: Math.round(quantity * cbmPerUnit * 10000) / 10000,
      remark: '',
    };
  };

  // Parse pcs/carton from specs string like "8pcs"
  const parsePcsFromSpecs = (specs: string): number => {
    if (!specs) return 0;
    const m = specs.match(/(\d+)\s*pcs/i);
    return m ? parseInt(m[1], 10) : 0;
  };

  // Quick price calculator
  // USD: (costPrice * profitFactor + fobCost/(containerCBM/productCbm)) / exchangeRate
  // RMB: costPrice * profitFactor
  const calcPrice = (costRmb: number, productCbm: number, _pcsPerCtn: number): number => {
    if (!costRmb) return 0;
    if (currency === 'USD') {
      if (!productCbm || productCbm <= 0 || exchangeRate <= 0) return 0;
      const shippingPerUnit = fobCost / (containerCBM / productCbm);
      const totalRmb = costRmb * profitFactor + shippingPerUnit;
      return Math.round((totalRmb / exchangeRate) * 100) / 100;
    }
    return Math.round(costRmb * profitFactor * 100) / 100;
  };

  const handleCostPriceChange = (itemId: string, costStr: string) => {
    const cost = parseFloat(costStr) || 0;
    setItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      const pcs = parsePcsFromSpecs(item.specs || '');
      const price = calcPrice(cost, Number(item.cbmPerUnit) || 0, pcs);
      return { ...item, costPrice: cost, unitPrice: price };
    }));
  };

  const confirmAddSelected = () => {
    if (selectedProducts.length === 0) return;
    const newItems = selectedProducts.map(buildItemFromProduct);
    setItems((prev) => {
      let next = [...prev];
      for (const item of newItems) {
        const emptyIdx = next.findIndex((i) => !i.description.trim());
        if (emptyIdx >= 0) next[emptyIdx] = item;
        else next.push(item);
      }
      return next;
    });
    setShowProductPicker(false);
    toast.success(`已添加 ${selectedProducts.length} 个产品`);
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
      ctnSize,
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
    } finally {
      e.target.value = '';
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
      documentNo: documentNo || `LVC${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      date,
      validity,
      currency,
      sellerInfo: seller,
      buyerInfo: buyer,
      items: validItems,
      terms,
      bankInfo,
      notes,
      shippingMark,
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
    const typeLabel = DOCUMENT_TYPE_LABELS[type] || 'Document';
    const customerName = (buyer.companyName || 'Customer').replace(/[\\/:*?"<>|]/g, '');
    document.title = `${typeLabel}-${documentNo || 'Document'}-${customerName}`;
    window.print();
    setTimeout(() => { document.title = 'ToyAdmin'; }, 100);
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
    shippingMark,
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
          <Button variant="outline" size="sm" onClick={() => setPrintLandscape(!printLandscape)}>
            {printLandscape ? '竖屏' : '横屏'}
          </Button>
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
              <div className="space-y-1">
                <Label className="text-xs">手写签名（用于签名处）</Label>
                <div className="flex items-center gap-3">
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded border bg-muted flex items-center justify-center">
                    {seller.signatureImage ? (
                      <img src={seller.signatureImage} alt="signature" className="h-full w-full object-contain" />
                    ) : (
                      <PenLine className="size-5 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" id="signature-upload" />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('signature-upload')?.click()} disabled={uploadingSignature}>
                      <Upload className="mr-1 size-3" />
                      {uploadingSignature ? '上传中' : '上传签名'}
                    </Button>
                    {seller.signatureImage && (
                      <Button variant="ghost" size="sm" onClick={() => setSeller({ ...seller, signatureImage: '' })}>
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

          {/* Quick Price Calculator Settings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">快速计价 QUICK PRICE</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">利润系数</Label>
                <Input type="number" step="0.01" value={profitFactor} onChange={(e) => setProfitFactor(parseFloat(e.target.value) || 1.13)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">40HQ FOB成本 (¥)</Label>
                <Input type="number" value={fobCost} onChange={(e) => setFobCost(parseFloat(e.target.value) || 8000)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">40HQ可装体积 (m³)</Label>
                <Input type="number" step="0.1" value={containerCBM} onChange={(e) => setContainerCBM(parseFloat(e.target.value) || 67)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">汇率 (RMB/USD)</Label>
                <Input type="number" step="0.01" value={exchangeRate} onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 6.7)} className="h-8 text-xs" />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between sticky top-0 z-10 bg-background border-b">
              <CardTitle className="text-sm">商品明细 ITEMS</CardTitle>
              <div className="flex gap-1.5 items-center">
                <button
                  type="button"
                  onClick={() => setShowRemark(!showRemark)}
                  className={`px-2 py-0.5 rounded text-xs border transition-colors ${showRemark ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-400'}`}
                >
                  Remark
                </button>
                <button
                  type="button"
                  onClick={() => setShowTotal(!showTotal)}
                  className={`px-2 py-0.5 rounded text-xs border transition-colors ${showTotal ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-400'}`}
                >
                  总价
                </button>
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
                  {!isPL && (
                    <div className="space-y-1">
                      <Label className="text-xs">Package Size</Label>
                      <Input value={item.ctnSize || ''} onChange={(e) => updateItem(item.id, 'ctnSize', e.target.value)} placeholder="如 40*25*8.7cm" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {!isPL ? (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs">Qty (CTN)</Label>
                          <Input type="number" value={item.quantity} onChange={(e) => {
                            const qty = Number(e.target.value);
                            updateItem(item.id, 'quantity', qty);
                            if (item.cbmPerUnit) {
                              updateItem(item.id, 'totalCbm', Number((qty * Number(item.cbmPerUnit)).toFixed(4)));
                            }
                          }} />
                        </div>
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
                          <Input type="number" step="0.0001" value={item.totalCbm} readOnly className="bg-muted cursor-not-allowed" placeholder="自动计算" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">成本价 (¥/个)</Label>
                          <Input type="number" step="0.01" value={item.costPrice || ''} onChange={(e) => handleCostPriceChange(item.id, e.target.value)} placeholder="输入成本价自动算价" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Unit Price</Label>
                          <Input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs">Qty (CTN)</Label>
                          <Input type="number" value={item.cartons} onChange={(e) => {
                            const ctns = Number(e.target.value);
                            updateItem(item.id, 'cartons', ctns);
                            if (item.cbmPerUnit) {
                              updateItem(item.id, 'cbm', Number((ctns * Number(item.cbmPerUnit)).toFixed(4)));
                            }
                          }} placeholder="箱数" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">CBM (m³/CTN)</Label>
                          <Input type="number" step="0.0001" value={item.cbmPerUnit} onChange={(e) => {
                            const cbm = Number(e.target.value);
                            updateItem(item.id, 'cbmPerUnit', cbm);
                            if (item.cartons) {
                              updateItem(item.id, 'cbm', Number((Number(item.cartons) * cbm).toFixed(4)));
                            }
                          }} placeholder="单箱体积" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">N.W. (kg)</Label>
                          <Input type="number" step="0.01" value={item.netWeight} onChange={(e) => updateItem(item.id, 'netWeight', Number(e.target.value))} placeholder="净重" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">G.W. (kg)</Label>
                          <Input type="number" step="0.01" value={item.grossWeight} onChange={(e) => updateItem(item.id, 'grossWeight', Number(e.target.value))} placeholder="毛重" />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <Label className="text-xs">Total CBM (m³)</Label>
                          <Input type="number" step="0.001" value={item.cbm} readOnly className="bg-muted cursor-not-allowed" placeholder="自动计算" />
                        </div>
                      </>
                    )}
                  </div>
                  {!isPL && showRemark && (
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
                {(terms.other ? terms.other.split('\n') : ['']).map((line, idx, arr) => (
                  <div key={idx} className="flex gap-1">
                    <Input
                      value={line}
                      onChange={(e) => {
                        const lines = terms.other ? terms.other.split('\n') : [''];
                        lines[idx] = e.target.value;
                        setTerms({ ...terms, other: lines.join('\n') });
                      }}
                      placeholder={`条款 ${idx + 1}`}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 px-0 text-red-500"
                      onClick={() => {
                        const lines = terms.other ? terms.other.split('\n') : [''];
                        lines.splice(idx, 1);
                        if (lines.length === 0) lines.push('');
                        setTerms({ ...terms, other: lines.join('\n') });
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-1"
                  onClick={() => {
                    const lines = terms.other ? terms.other.split('\n') : [];
                    lines.push('');
                    setTerms({ ...terms, other: lines.join('\n') });
                  }}
                >
                  + 添加条款
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Mark - shown for CI and PL */}
          {(type === 'ci' || type === 'pl') && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">唛头 SHIPPING MARK</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={shippingMark}
                  onChange={(e) => setShippingMark(e.target.value)}
                  rows={5}
                  placeholder={'例如：\nMADE IN CHINA\nNO. 1-UP\nC/NO. 1-100\nG.W.: XX KGS\nN.W.: XX KGS\nMEAS.: XX CM'}
                  className="font-mono text-xs"
                />
              </CardContent>
            </Card>
          )}

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
              <DocumentPreview data={previewData} showRemark={showRemark} showTotal={showTotal} />
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { margin: 8mm; size: A4 ${printLandscape ? 'landscape' : 'portrait'}; background: white; }
          html, body { overflow: visible !important; height: auto !important; background: white !important; }
          body { background: white !important; }
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area .no-print { display: none !important; }
          .print-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; height: auto !important; background: white !important; }
          .print-area .sticky { position: static !important; box-shadow: none !important; border: none !important; padding: 0 !important; background: white !important; }
          .print-area > div > div:last-child { max-height: none !important; overflow: visible !important; padding: 0 !important; box-shadow: none !important; border-radius: 0 !important; background: white !important; }
          .print-area .document-preview { padding: 0 !important; max-width: 100% !important; background: white !important; font-size: 9px !important; }
          .print-area table { table-layout: auto !important; width: 100% !important; font-size: 9px !important; }
          .print-area img { object-fit: contain !important; max-height: 50px !important; width: auto !important; }
          .print-area thead tr { background-color: #1F4E78 !important; }
          .print-area thead { display: table-row-group !important; }
          .print-area thead th { padding: 3px 4px !important; font-size: 8px !important; }
          .print-area tbody td { padding: 2px 4px !important; }
          .print-area tbody tr:nth-child(even) { background-color: #f9fafb !important; }
          .print-area tfoot tr { background-color: transparent !important; }
          .print-area h1 { font-size: 14px !important; margin: 0 !important; }
          .print-area h2 { font-size: 16px !important; margin: 0 !important; }
          .print-area h3 { font-size: 10px !important; margin: 4px 0 2px !important; }
          .print-area h4 { font-size: 9px !important; margin: 4px 0 2px !important; }
          .print-area p, .print-area div { font-size: 9px !important; line-height: 1.3 !important; margin: 0 !important; }
          .print-area .mb-6 { margin-bottom: 6px !important; }
          .print-area .mb-4 { margin-bottom: 4px !important; }
          .print-area .mb-2 { margin-bottom: 2px !important; }
          .print-area .mt-6 { margin-top: 6px !important; }
          .print-area .mt-4 { margin-top: 4px !important; }
          .print-area .mt-2 { margin-top: 2px !important; }
          .print-area .mt-10 { margin-top: 10px !important; }
          .print-area .border-b-2 { border-bottom-width: 1px !important; }
          .print-area .pb-4 { padding-bottom: 4px !important; }
          .print-area .flex.justify-between.items-start.gap-3 img { width: 40px !important; height: 40px !important; }
          .print-area [class*="bg-[#f0f4f8]"] { padding: 4px !important; margin-bottom: 4px !important; }
          .print-area ul { margin: 0 !important; padding-left: 16px !important; }
          .print-area li { margin: 0 !important; }
          .print-area img[alt="seal"] { max-height: 90px !important; max-width: 90px !important; }
          .print-area img[alt="signature"] { max-height: 50px !important; max-width: 160px !important; }
          .print-area .document-preview { page-break-inside: avoid !important; }
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
                onClick={() => toggleSelectProduct(product)}
                className={`text-left rounded-lg border p-3 transition-all cursor-pointer ${
                  selectedProducts.find((p) => p.id === product.id)
                    ? 'border-[#1F4E78] bg-blue-50 ring-2 ring-[#1F4E78]/30'
                    : 'hover:border-[#1F4E78] hover:shadow-md'
                }`}
              >
                    <div className="aspect-square rounded bg-muted mb-2 overflow-hidden relative">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                          <Package className="size-8" />
                        </div>
                      )}
                      {selectedProducts.find((p) => p.id === product.id) && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#1F4E78] text-white flex items-center justify-center text-xs">✓</div>
                      )}
                    </div>
                    <div className="text-sm font-medium line-clamp-2">{product.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">货号: {product.itemNumber}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">MOQ: {product.moq}</span>
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
          {/* Footer with multi-select confirm */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <span className="text-xs text-muted-foreground">
              {selectedProducts.length > 0 ? `已选 ${selectedProducts.length} 个产品` : '点击产品卡片进行多选'}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowProductPicker(false)}>取消</Button>
              <Button size="sm" className="bg-[#1F4E78] hover:bg-[#1a3a5c]" disabled={selectedProducts.length === 0} onClick={confirmAddSelected}>
                添加选中 ({selectedProducts.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
