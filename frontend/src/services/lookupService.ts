import { apiClient } from '../api/client';

export interface LookupData {
  assetCategories: string[];
  departments: string[];
  gates: string[];
}

export const lookupService = {
  getAll: async (): Promise<LookupData> => (await apiClient.get<LookupData>('/lookups/')).data,
};
