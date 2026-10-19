import { apiClient } from '../api/client';
import { OfficerProfile } from '../types';

export const profileService = {
  updateProfile: async (updated: Partial<OfficerProfile>, avatarFile?: File): Promise<OfficerProfile> => {
    const fields: Record<string, string> = {};
    if (updated.firstName !== undefined) fields.first_name = updated.firstName;
    if (updated.lastName !== undefined) fields.last_name = updated.lastName;
    if (updated.email !== undefined) fields.email = updated.email;
    if (updated.phone !== undefined) fields.phone = updated.phone;
    if (updated.department !== undefined) fields.department = updated.department;
    let response;
    if (avatarFile) {
      const form = new FormData();
      Object.entries(fields).forEach(([key, value]) => form.append(key, value));
      form.append('profile_picture', avatarFile);
      // Fetch leaves Content-Type unset so the browser supplies the multipart boundary.
      const token = localStorage.getItem('soc_token');
      const apiBase = (apiClient.defaults.baseURL || '').replace(/\/+$/, '');
      const uploadResponse = await fetch(`${apiBase}/profile/`, {
      // Django parses multipart form bodies into request.FILES for POST.
      // PATCH multipart requests need special parsing and can otherwise fail
      // before CORS headers are attached.
      method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(data.message || data.error || 'Unable to save profile picture.');
      localStorage.setItem('soc_user', JSON.stringify(data));
      return data as OfficerProfile;
    } else {
      response = await apiClient.patch<OfficerProfile>('/profile/', fields);
    }
    localStorage.setItem('soc_user', JSON.stringify(response.data));
    return response.data;
  },
};
