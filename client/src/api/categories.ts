import { http } from '@client/src/utils/http';
import type { Category } from '@shared/api.interface';

export const listCategories = async (): Promise<Category[]> => {
  const res = await http.get('/api/categories');
  return res.data;
};

export const createCategory = async (
  data: Partial<Category>,
): Promise<Category> => {
  const res = await http.post('/api/categories', data);
  return res.data;
};

export const updateCategory = async (
  id: string,
  data: Partial<Category>,
): Promise<Category> => {
  const res = await http.put(`/api/categories/${id}`, data);
  return res.data;
};

export const deleteCategory = async (id: string): Promise<{ success: boolean }> => {
  const res = await http.delete(`/api/categories/${id}`);
  return res.data;
};
