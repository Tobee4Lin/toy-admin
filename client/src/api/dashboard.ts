import { http } from '@client/src/utils/http';
import type {
  CategoryDistribution,
  DashboardStats,
  Inquiry,
} from '@shared/api.interface';

export const getStats = async (): Promise<DashboardStats> => {
  const res = await http.get('/api/dashboard/stats');
  return res.data;
};

export const getRecentInquiries = async (
  limit = 5,
): Promise<{ items: Inquiry[] }> => {
  const res = await http.get('/api/dashboard/recent-inquiries', {
    params: { limit },
  });
  return res.data;
};

export const getCategoryDistribution = async (): Promise<{
  items: CategoryDistribution[];
}> => {
  const res = await http.get('/api/dashboard/category-distribution');
  return res.data;
};
