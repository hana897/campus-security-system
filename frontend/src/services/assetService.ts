import { apiClient } from '../api/client';
import { Asset, AssetStatus } from '../types';

type AssetPayload = Omit<Asset, 'id' | 'registrationDate'> & { description?: string };

export const assetService = {
  getAll: async (filters?: { status?: string; category?: string; query?: string }): Promise<Asset[]> => {
    const { data } = await apiClient.get<Asset[]>('/assets/', { params: filters });
    return data.map((asset) => ({ ...asset, qrCode: asset.id }));
  },

  getById: async (id: string): Promise<Asset | null> => {
    try {
      const { data } = await apiClient.get<Asset>(`/assets/${encodeURIComponent(id)}/`);
      return { ...data, qrCode: data.id };
    } catch (error) {
      if ((error as { status?: number }).status === 404) return null;
      throw error;
    }
  },

  create: async (assetData: AssetPayload): Promise<Asset> => {
    const form = new FormData();
    form.append('name', assetData.name);
    form.append('description', assetData.description || '');
    form.append('brand', assetData.brand);
    form.append('model', assetData.model);
    form.append('serial', assetData.serial);
    form.append('category', assetData.category);
    if (assetData.registrationDateTime) form.append('registrationDateTime', assetData.registrationDateTime);
    form.append('status', assetData.status);
    form.append('ownerId', assetData.ownerId);
    form.append('ownerMatric', assetData.ownerMatric);
    form.append('notes', assetData.notes || '');
    if (assetData.image) form.append('image', assetData.image);
    const { data } = await apiClient.post<Asset>('/assets/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return { ...assetData, ...data, qrCode: data.id };
  },

  updateStatus: async (id: string, newStatus: AssetStatus, notes?: string): Promise<Asset> => {
    const { data } = await apiClient.patch<Asset>(`/assets/${encodeURIComponent(id)}/`, { status: newStatus, notes });
    return { ...data, qrCode: data.id };
  },

  assignOwner: async (id: string, ownerId: string): Promise<Asset> => {
    const { data } = await apiClient.patch<Asset>(`/assets/${encodeURIComponent(id)}/`, { ownerId });
    return { ...data, qrCode: data.id };
  },

};
