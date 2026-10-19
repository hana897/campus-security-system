import { apiClient } from '../api/client';
import { OfficerProfile } from '../types';
import { DEFAULT_OFFICER } from '../constants';

interface LoginResponse { token: string; user: OfficerProfile; }

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const { data } = await apiClient.post<LoginResponse>('/auth/login/', { email: email.trim().toLowerCase(), password });
      localStorage.setItem('soc_token', data.token);
      localStorage.setItem('soc_user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      throw new Error((error as { message?: string }).message || 'Unable to sign in. Check your email and password.');
    }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      await apiClient.post('/auth/change-password/', { currentPassword, newPassword });
      localStorage.removeItem('soc_token');
    } catch (error) {
      throw new Error((error as { message?: string }).message || 'Unable to change password.');
    }
  },

  getCurrentUser: (): OfficerProfile => {
    const saved = localStorage.getItem('soc_user');
    if (saved) {
      try { return JSON.parse(saved) as OfficerProfile; } catch { localStorage.removeItem('soc_user'); }
    }
    return DEFAULT_OFFICER;
  },

  refreshCurrentUser: async (): Promise<OfficerProfile> => {
    const { data } = await apiClient.get<OfficerProfile>('/auth/me/');
    localStorage.setItem('soc_user', JSON.stringify(data));
    return data;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('soc_token');
    localStorage.removeItem('soc_user');
  },
};
