import { http } from '@client/src/utils/http';
import type { PaginatedResponse, Product } from '@shared/api.interface';

export const listProducts = async (params: {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<Product>> => {
  const res = await http.get('/api/products', { params });
  return res.data;
};

export const getProduct = async (id: string): Promise<Product> => {
  const res = await http.get(`/api/products/${id}`);
  return res.data;
};

export const createProduct = async (data: Partial<Product>): Promise<Product> => {
  const res = await http.post('/api/products', data);
  return res.data;
};

export const updateProduct = async (
  id: string,
  data: Partial<Product>,
): Promise<Product> => {
  const res = await http.put(`/api/products/${id}`, data);
  return res.data;
};

export const deleteProduct = async (id: string): Promise<{ success: boolean }> => {
  const res = await http.delete(`/api/products/${id}`);
  return res.data;
};

export const batchDeleteProducts = async (
  ids: string[],
): Promise<{ success: boolean; deletedCount: number }> => {
  const res = await http.delete('/api/products/batch', { data: { ids } });
  return res.data;
};

export const toggleFeatured = async (
  id: string,
): Promise<{ id: string; isFeatured: boolean }> => {
  const res = await http.post(`/api/products/${id}/featured`);
  return res.data;
};
