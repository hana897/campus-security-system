import { UserSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { apiClient } from '../api/client';

export const settingsService = {
  getSettings: async (): Promise<UserSettings> => {
    const { data } = await apiClient.get<Partial<UserSettings>>('/settings/');
    return { ...DEFAULT_SETTINGS, ...data, notifications: { ...DEFAULT_SETTINGS.notifications, ...data.notifications, channels: { ...DEFAULT_SETTINGS.notifications.channels, ...data.notifications?.channels } }, scanner: { ...DEFAULT_SETTINGS.scanner, ...data.scanner }, terminal: { ...DEFAULT_SETTINGS.terminal, ...data.terminal } };
  },

  saveSettings: async (newSettings: UserSettings): Promise<UserSettings> => {
    const { data } = await apiClient.put<UserSettings>('/settings/', newSettings);
    document.documentElement.setAttribute('data-theme', newSettings.theme);
    return data;
  },
};
