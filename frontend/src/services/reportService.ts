import { apiClient } from '../api/client';
import { VerificationLog } from '../types';

export interface ReportAsset {
  id: string;
  name: string;
  brand: string;
  model: string;
  serial: string;
  category: string;
  status: string;
  purchaseDate: string;
  registrationDateTime: string;
  ownerName: string;
  ownerId: string;
  ownerPhone: string;
  department: string;
  registeredBy: string;
  notes: string;
  photoUrl: string;
  qrCodeUrl: string;
}

export interface ReportOverview {
  todayVerifications: number;
  successfulVerificationsToday: number;
  authorizedCount: number;
  flaggedCount: number;
  interceptions: number;
  totalRegisteredAssets: number;
  activeSecurityAccounts: number;
  lostCount: number;
  stolenCount: number;
  ownerCount: number;
  assets: ReportAsset[];
  recentVerifications: VerificationLog[];
}

export const reportService = {
  getOverviewMetrics: async (): Promise<ReportOverview> => {
    const { data } = await apiClient.get<ReportOverview>('/reports/overview/');
    return data;
  },

  download: async (format: 'pdf' | 'csv'): Promise<void> => {
    const { data } = await apiClient.get<Blob>(`/reports/export/${format}/`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campus-security-report.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
