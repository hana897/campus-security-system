import { apiClient } from '../api/client';

export interface ManagedAdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  department: string;
  status: 'ACTIVE' | 'SUSPENDED';
  lastLogin: string;
  avatarUrl?: string;
}

export const adminUserService = {
  list: async (): Promise<ManagedAdminUser[]> => (await apiClient.get<ManagedAdminUser[]>('/users/')).data,
  create: async (user: { firstName: string; lastName: string; email: string; phone: string; password: string }): Promise<ManagedAdminUser> =>
    (await apiClient.post<ManagedAdminUser>('/users/', user)).data,
  setActive: async (id: string, isActive: boolean): Promise<void> => {
    await apiClient.patch(`/users/${id}/`, { isActive });
  },
  disable: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}/`);
  },
};
