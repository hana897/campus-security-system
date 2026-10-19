import { apiClient } from '../api/client';
import { Owner } from '../types';

export type NewOwner = Pick<Owner, 'fullName' | 'universityId' | 'email' | 'phone' | 'department' | 'role'> & {
  photo?: File;
  document?: File;
};

export type OwnerUpdate = Partial<Pick<Owner, 'fullName' | 'email' | 'phone' | 'department' | 'role'>> & {
  photo?: File;
  document?: File;
  removePhoto?: boolean;
  removeDocument?: boolean;
};

export const ownerService = {
  getAll: async (query?: string, department?: string): Promise<Owner[]> => {
    const { data } = await apiClient.get<Owner[]>('/owners/');
    return data.filter((owner) =>
      (!department || owner.department === department) &&
      (!query || [owner.fullName, owner.universityId, owner.email].some((value) => value.toLowerCase().includes(query.toLowerCase())))
    );
  },

  getById: async (id: string): Promise<Owner | null> => {
    try {
      const { data } = await apiClient.get<Owner>(`/owners/${encodeURIComponent(id)}/`);
      return data;
    } catch (error) {
      if ((error as { status?: number }).status === 404) return null;
      throw error;
    }
  },

  create: async (owner: NewOwner): Promise<Owner> => {
    const form = new FormData();
    form.append('fullName', owner.fullName);
    form.append('universityId', owner.universityId);
    form.append('email', owner.email);
    form.append('phone', owner.phone);
    form.append('department', owner.department);
    form.append('role', owner.role);
    if (owner.photo) form.append('photo', owner.photo);
    if (owner.document) form.append('document', owner.document);
    const { data } = await apiClient.post<Owner>('/owners/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  update: async (id: string, owner: OwnerUpdate): Promise<Owner> => {
    const form = new FormData();
    if (owner.fullName) form.append('fullName', owner.fullName);
    if (owner.email !== undefined) form.append('email', owner.email || '');
    if (owner.phone !== undefined) form.append('phone', owner.phone || '');
    if (owner.department) form.append('department', owner.department);
    if (owner.role) form.append('role', owner.role);
    if (owner.photo) form.append('photo', owner.photo);
    if (owner.document) form.append('document', owner.document);
    if (owner.removePhoto) form.append('removePhoto', 'true');
    if (owner.removeDocument) form.append('removeDocument', 'true');

    const { data } = await apiClient.patch<Owner>(`/owners/${encodeURIComponent(id)}/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
