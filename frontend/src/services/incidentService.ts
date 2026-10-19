import { Incident } from '../types';
import { apiClient } from '../api/client';

export const incidentService = {
  getAll: async (): Promise<Incident[]> => {
    const { data } = await apiClient.get<Incident[]>('/incidents/');
    return data;
  },

  create: async (data: Omit<Incident, 'id' | 'incidentNumber' | 'reportedAt'>): Promise<Incident> => {
    const { data: saved } = await apiClient.post<Incident>('/incidents/', data);
    return saved;
  },
};
