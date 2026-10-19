export type AssetStatus =
  | 'AUTHORIZED'
  | 'LOST'
  | 'STOLEN'
  | 'UNDER_REVIEW'
  | 'RECOVERED';

export type AssetCategory = string;

export interface Asset {
  id: string; // e.g. AST-2026-00482
  name: string;
  brand: string;
  model: string;
  serial: string;
  category: AssetCategory;
  color: string;
  purchaseDate?: string;
  registrationDate: string;
  registrationDateTime?: string;
  status: AssetStatus;
  ownerId: string;
  ownerName: string;
  ownerMatric: string; // e.g. DBU-2024-0182
  department: string;
  ownerPhone?: string;
  photoUrl?: string;
  ownerAvatarUrl?: string;
  image?: File;
  qrCode?: string;
  notes?: string;
  registeredBy?: string;
  registeredByAvatarUrl?: string;
}

export type OwnerRole = 'STUDENT' | 'STAFF' | 'FACULTY' | 'VISITOR';
export type OwnerStatus = 'ACTIVE' | 'SUSPENDED' | 'ALUMNI';

export interface Owner {
  id: string;
  universityId: string; // e.g. DBU-2024-0182
  fullName: string;
  email: string;
  phone: string;
  department: string;
  role: OwnerRole;
  status: OwnerStatus;
  avatarUrl?: string;
  documentName?: string;
  documentUrl?: string;
  registeredAssetsCount: number;
  authorizedCount: number;
  lostCount: number;
  stolenCount: number;
  joinedDate: string;
}

export type OfficerStatus = 'ACTIVE' | 'ON_BREAK' | 'OFF_DUTY' | 'SUSPENDED';

export interface OfficerProfile {
  id: string;
  officerId: string; // e.g. SEC-00482
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'SECURITY' | 'MANAGER';
  phone: string;
  department: string;
  position: string;
  campus: string;
  assignedGate: string;
  status: OfficerStatus;
  clearanceLevel: number;
  avatarUrl?: string;
  joinedAt: string;
  shiftStartedAt: string;
}

export interface VerificationLog {
  id: string;
  assetId: string;
  assetName: string;
  assetSerial: string;
  ownerName: string;
  ownerId: string;
  gate: string;
  officerName: string;
  officerId: string;
  timestamp: string;
  result: AssetStatus | 'APPROVED' | 'REJECTED';
  method: 'QR_CODE' | 'ASSET_CODE' | 'MANUAL';
  remarks?: string;
}

export interface ExitPass {
  id: string;
  passCode: string; // e.g. GP-2026-000482
  assetId: string;
  assetName: string;
  serial: string;
  ownerName: string;
  universityId: string;
  department: string;
  gate: string;
  officerName: string;
  issuedAt: string;
  expiresAt: string;
  status: 'AUTHORIZED' | 'PENDING' | 'REJECTED' | 'EXPIRED';
  reason: 'Personal' | 'Repair' | 'Campus Relocation' | 'Temporary Removal' | 'Other';
  destination?: string;
  officerNotes?: string;
}

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';

export interface Incident {
  id: string;
  incidentNumber: string; // e.g. INC-2026-0021
  title: string;
  assetId: string;
  assetName: string;
  ownerName: string;
  universityId: string;
  reportedAt: string;
  gate: string;
  reportingOfficer: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  assignedInvestigator?: string;
  resolutionNotes?: string;
}

export interface GateInfo {
  id: string;
  name: string;
  status: 'OPERATIONAL' | 'BUSY' | 'MAINTENANCE' | 'OFFLINE';
  todayScans: number;
  peopleEntering: number;
  peopleExiting: number;
  activeAlerts: number;
}

export interface SecurityScore {
  overall: number;
  riskLevel: 'LOW RISK' | 'MODERATE' | 'ELEVATED' | 'HIGH RISK';
  factors: {
    gateActivity: string;
    lostAssets: number;
    stolenAssets: number;
    unusualActivity: string;
    pendingReviews: number;
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  timestamp: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  read: boolean;
  link?: string;
}

export interface NotificationPreferences {
  stolenAssetAlert: boolean;
  lostAssetAlert: boolean;
  ownerMismatch: boolean;
  suspiciousActivity: boolean;
  verificationCompleted: boolean;
  exitAuthorized: boolean;
  incidentAssigned: boolean;
  systemMaintenance: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };
}

export interface ScannerSettings {
  preferredCamera: 'environment' | 'user';
  scanSound: boolean;
  successSound: boolean;
  warningSound: boolean;
  autoSubmitScannedCodes: boolean;
  vibrationFeedback: boolean;
  continuousScanning: boolean;
}

export interface TerminalSettings {
  terminalId: string;
  assignedGate: string;
  displayDensity: 'compact' | 'comfortable';
  showOfficerIdentity: boolean;
  showGateInfo: boolean;
  showSystemClock: boolean;
  requireExitPassConfirmation: boolean;
  autoOpenResultModal: boolean;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  density: 'compact' | 'comfortable';
  reducedMotion: boolean;
  accentColor: 'cobalt' | 'cyan' | 'violet' | 'emerald';
  notifications: NotificationPreferences;
  scanner: ScannerSettings;
  terminal: TerminalSettings;
}
