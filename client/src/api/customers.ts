import { http } from '@client/src/utils/http';

export interface Customer {
  id: string;
  customerNo: string;
  company: string;
  country?: string;
  city?: string;
  background?: string;
  scale?: string;
  employeeCount?: string;
  foundedYear?: string;
  source?: string;
  contactPerson?: string;
  whatsapp?: string;
  googleAddress?: string;
  facebook?: string;
  website?: string;
  email?: string;
  instagram?: string;
  linkedin?: string;
  contactInvalid?: Record<string, boolean>;
  customerType?: string;
  priority?: string;
  brandUsed?: string;
  businessDetail?: string;
  lastFollowUpAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFollowup {
  id: string;
  customerId: string;
  followDate: string;
  content?: string;
  feedback?: string;
  isReplied: boolean;
  createdAt: string;
}

export interface CustomerStats {
  total: number;
  notContacted: number;
  contactedIn7Days: number;
  notFollowedIn30Days: number;
}

export interface CustomerListResponse {
  items: Customer[];
  total: number;
  page: number;
  pageSize: number;
}

export const listCustomers = async (params: {
  search?: string;
  contactStatus?: string;
  priority?: string;
  page?: number;
  pageSize?: number;
}): Promise<CustomerListResponse> => {
  const res = await http.get('/api/customers', { params });
  return res.data;
};

export const getCustomer = async (id: string): Promise<Customer & { followups: CustomerFollowup[] }> => {
  const res = await http.get(`/api/customers/${id}`);
  return res.data;
};

export const getCustomerStats = async (): Promise<CustomerStats> => {
  const res = await http.get('/api/customers/stats');
  return res.data;
};

export const createCustomer = async (data: Partial<Customer>): Promise<Customer> => {
  const res = await http.post('/api/customers', data);
  return res.data;
};

export const createCustomerFromInquiry = async (inquiryId: number): Promise<Customer> => {
  const res = await http.post('/api/customers/from-inquiry', { inquiryId });
  return res.data;
};

export const updateCustomer = async (id: string, data: Partial<Customer>): Promise<Customer> => {
  const res = await http.put(`/api/customers/${id}`, data);
  return res.data;
};

export const deleteCustomer = async (id: string): Promise<{ success: boolean }> => {
  const res = await http.delete(`/api/customers/${id}`);
  return res.data;
};

export const addFollowup = async (
  customerId: string,
  data: { followDate: string; content?: string; feedback?: string },
): Promise<CustomerFollowup> => {
  const res = await http.post(`/api/customers/${customerId}/followups`, data);
  return res.data;
};

export const deleteFollowup = async (followupId: string): Promise<{ success: boolean }> => {
  const res = await http.delete(`/api/customers/followups/${followupId}`);
  return res.data;
};

export const toggleFollowupReplied = async (
  followupId: string,
): Promise<{ id: string; isReplied: boolean }> => {
  const res = await http.put(`/api/customers/followups/${followupId}/toggle-replied`);
  return res.data;
};
