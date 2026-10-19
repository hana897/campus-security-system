import { UserSettings, OfficerProfile, AssetStatus } from '../types';

export const DEFAULT_OFFICER: OfficerProfile = {
  id: '',
  officerId: '',
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  role: 'SECURITY',
  phone: '',
  department: '',
  position: '',
  campus: '',
  assignedGate: '',
  status: 'OFF_DUTY',
  clearanceLevel: 0,
  avatarUrl: '',
  joinedAt: '',
  shiftStartedAt: '',
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  density: 'comfortable',
  reducedMotion: false,
  accentColor: 'cobalt',
  notifications: {
    stolenAssetAlert: true,
    lostAssetAlert: true,
    ownerMismatch: true,
    suspiciousActivity: true,
    verificationCompleted: true,
    exitAuthorized: true,
    incidentAssigned: true,
    systemMaintenance: false,
    channels: {
      inApp: true,
      email: true,
      sms: false,
    },
  },
  scanner: {
    preferredCamera: 'environment',
    scanSound: true,
    successSound: true,
    warningSound: true,
    autoSubmitScannedCodes: true,
    vibrationFeedback: true,
    continuousScanning: false,
  },
  terminal: {
    terminalId: 'TERM-NORTH-01',
    assignedGate: 'Main Gate',
    displayDensity: 'compact',
    showOfficerIdentity: true,
    showGateInfo: true,
    showSystemClock: true,
    requireExitPassConfirmation: true,
    autoOpenResultModal: true,
  },
};

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeClass: string;
  description: string;
}

export const getAssetStatusConfig = (status: AssetStatus): StatusConfig => {
  switch (status) {
    case 'AUTHORIZED':
      return {
        label: 'AUTHORIZED',
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
        badgeClass: 'badge-authorized',
        description: 'Asset is cleared for campus exit and regular transit.',
      };
    case 'LOST':
      return {
        label: 'LOST',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.12)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        badgeClass: 'badge-lost',
        description: 'Reported lost by owner. Intercept and verify identification.',
      };
    case 'STOLEN':
      return {
        label: 'STOLEN',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(239, 68, 68, 0.4)',
        badgeClass: 'badge-stolen',
        description: 'CRITICAL SECURITY ALERT: Confirmed stolen item. Detain item and alert security command.',
      };
    case 'UNDER_REVIEW':
      return {
        label: 'UNDER REVIEW',
        color: '#8b5cf6',
        bgColor: 'rgba(139, 92, 246, 0.12)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        badgeClass: 'badge-review',
        description: 'Temporary hold pending proof of ownership or gate clearance.',
      };
    case 'RECOVERED':
      return {
        label: 'RECOVERED',
        color: '#06b6d4',
        bgColor: 'rgba(6, 182, 212, 0.12)',
        borderColor: 'rgba(6, 182, 212, 0.3)',
        badgeClass: 'badge-recovered',
        description: 'Previously flagged asset now recovered and held for owner retrieval.',
      };
    default:
      return {
        label: status,
        color: '#94a3b8',
        bgColor: 'rgba(148, 163, 184, 0.12)',
        borderColor: 'rgba(148, 163, 184, 0.3)',
        badgeClass: 'badge-default',
        description: 'Unknown asset condition.',
      };
  }
};
