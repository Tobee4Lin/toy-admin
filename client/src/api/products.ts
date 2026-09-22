import { http } from '@client/src/utils/http';
import type { PaginatedResponse, Product } from '@shared/api.interface';

export type { Product };

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

export const downloadProductTemplate = async (): Promise<void> => {
  const res = await http.get('/api/products/template/download', {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'product_import_template.xlsx');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const batchImportProducts = async (
  file: File,
): Promise<{
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await http.post('/api/products/batch-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const batchImportProductsJson = async (
  products: Array<Record<string, unknown>>,
): Promise<{
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}> => {
  const res = await http.post('/api/products/batch-import-json', { products });
  return res.data;
};

export interface BatchImageAssignment {
  id: number;
  mainImage?: string | null;
  gallery?: string[];
}

export const batchAssignImages = async (payload: {
  mode?: 'replace' | 'append';
  assignments: BatchImageAssignment[];
}): Promise<{
  updated: number;
  products: Array<{
    id: number;
    name: string;
    itemNumber: string;
    imageUrl: string;
    galleryCount: number;
  }>;
  missing: number[];
}> => {
  const res = await http.post('/api/products/batch-images', payload);
  return res.data;
};
