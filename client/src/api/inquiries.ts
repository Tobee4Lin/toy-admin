import { http } from '@client/src/utils/http';
import type { Inquiry, InquiryListResponse } from '@shared/api.interface';

export const listInquiries = async (params: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<InquiryListResponse> => {
  const res = await http.get('/api/inquiries', { params });
  return res.data;
};

export const getInquiry = async (id: string): Promise<Inquiry> => {
  const res = await http.get(`/api/inquiries/${id}`);
  return res.data;
};

export const updateInquiryStatus = async (
  id: string,
  status: string,
): Promise<{ id: string; status: string }> => {
  const res = await http.put(`/api/inquiries/${id}/status`, { status });
  return res.data;
};

export const deleteInquiry = async (
  id: string,
): Promise<{ success: boolean }> => {
  const res = await http.delete(`/api/inquiries/${id}`);
  return res.data;
};
