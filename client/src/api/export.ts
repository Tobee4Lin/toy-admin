import { http } from '@client/src/utils/http';

export const exportProducts = async (): Promise<void> => {
  const res = await http.get('/api/export/products', {
    responseType: 'blob',
  });
  triggerDownload(res.data, 'products.json');
};

export const exportCategories = async (): Promise<void> => {
  const res = await http.get('/api/export/categories', {
    responseType: 'blob',
  });
  triggerDownload(res.data, 'categories.json');
};

export const exportBlog = async (): Promise<void> => {
  const res = await http.get('/api/export/blog', {
    responseType: 'blob',
  });
  triggerDownload(res.data, 'blog.json');
};

const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
