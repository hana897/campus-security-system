import { apiClient } from '../api/client';
import { NotificationItem } from '../types';

export const notificationService = {
  getAll: async (): Promise<NotificationItem[]> => (await apiClient.get<NotificationItem[]>('/notifications/')).data,
  markRead: async (id: string): Promise<NotificationItem> => (await apiClient.patch<NotificationItem>(`/notifications/${id}/`, { read: true })).data,
};
