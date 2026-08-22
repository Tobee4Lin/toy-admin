import { http } from '@/utils/http';

export interface DocumentItem {
  id: string;
  image?: string;
  description: string;
  specs?: string;
  moq?: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
  amount?: number;
  cartons?: number;
  ctnSize?: string;
  grossWeight?: number;
  netWeight?: number;
  cbm?: number;
  cbmPerUnit?: number;
  totalCbm?: number;
  remark?: string;
}

export interface SellerInfo {
  companyName: string;
  email: string;
  tel: string;
  address: string;
  logo?: string;
  sealImage?: string;
}

export interface BuyerInfo {
  companyName: string;
  attn?: string;
  address: string;
  tel?: string;
  email?: string;
}

export interface DocumentTerms {
  priceTerm?: string;
  paymentTerm?: string;
  deliveryTime?: string;
  port?: string;
  other?: string;
}

export interface BankInfo {
  bankName?: string;
  bankAddress?: string;
  accountName?: string;
  accountNumber?: string;
  swiftCode?: string;
  iban?: string;
  routingNumber?: string;
}

export interface DocumentData {
  id?: number;
  type: 'quotation' | 'pi' | 'ci' | 'pl';
  documentNo: string;
  date?: string;
  validity?: string;
  sellerInfo?: SellerInfo;
  buyerInfo?: BuyerInfo;
  items?: DocumentItem[];
  terms?: DocumentTerms;
  bankInfo?: BankInfo;
  notes?: string;
  totalAmount?: string;
  currency?: string;
  status?: 'draft' | 'sent' | 'confirmed';
  createdAt?: string;
  updatedAt?: string;
}

export const documentsApi = {
  async getAll(type?: string): Promise<DocumentData[]> {
    const params = type ? `?type=${type}` : '';
    const res = await http.get(`/api/documents${params}`);
    return res.data;
  },

  async getById(id: number): Promise<DocumentData> {
    const res = await http.get(`/api/documents/${id}`);
    return res.data;
  },

  async create(data: DocumentData): Promise<DocumentData> {
    const res = await http.post('/api/documents', data);
    return res.data;
  },

  async update(id: number, data: Partial<DocumentData>): Promise<DocumentData> {
    const res = await http.put(`/api/documents/${id}`, data);
    return res.data;
  },

  async delete(id: number): Promise<{ success: boolean }> {
    const res = await http.delete(`/api/documents/${id}`);
    return res.data;
  },
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  quotation: '报价单 Quotation',
  pi: '形式发票 PI',
  ci: '商业发票 CI',
  pl: '装箱单 PL',
};

export const DOCUMENT_TYPE_TITLES: Record<string, string> = {
  quotation: 'QUOTATION',
  pi: 'PROFORMA INVOICE',
  ci: 'COMMERCIAL INVOICE',
  pl: 'PACKING LIST',
};
