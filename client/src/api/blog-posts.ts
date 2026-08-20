import { http } from '@client/src/utils/http';
import type { BlogPost, PaginatedResponse } from '@shared/api.interface';

export const listBlogPosts = async (params: {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<BlogPost>> => {
  const res = await http.get('/api/blog-posts', { params });
  return res.data;
};

export const getBlogPost = async (id: string): Promise<BlogPost> => {
  const res = await http.get(`/api/blog-posts/${id}`);
  return res.data;
};

export const createBlogPost = async (data: Partial<BlogPost>): Promise<BlogPost> => {
  const res = await http.post('/api/blog-posts', data);
  return res.data;
};

export const updateBlogPost = async (
  id: string,
  data: Partial<BlogPost>,
): Promise<BlogPost> => {
  const res = await http.put(`/api/blog-posts/${id}`, data);
  return res.data;
};

export const deleteBlogPost = async (
  id: string,
): Promise<{ success: boolean }> => {
  const res = await http.delete(`/api/blog-posts/${id}`);
  return res.data;
};
