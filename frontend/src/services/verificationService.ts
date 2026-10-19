import { Asset, VerificationLog, ExitPass } from '../types';
import { apiClient } from '../api/client';

export const verificationService = {
  verifyCode: async (code: string, gate: string, officerName: string): Promise<{ asset: Asset; log: VerificationLog }> => {
    const { data } = await apiClient.post<{ asset: Asset; log: VerificationLog }>('/verification/verify/', { asset_code: code.trim(), gate, officerName });
    return data;
  },

  getHistory: async (): Promise<VerificationLog[]> => {
    const { data } = await apiClient.get<VerificationLog[]>('/verification/history/');
    return data;
  },

  getExitPasses: async (): Promise<ExitPass[]> => [],

  issueExitPass: async (passData: Omit<ExitPass, 'id' | 'passCode' | 'issuedAt' | 'expiresAt' | 'status'>): Promise<ExitPass> => {
    const { data } = await apiClient.post<ExitPass>('/exit-passes/', passData);
    return data;
  },
};
