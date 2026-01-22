
export enum UserRole {
  RESIDENT = 'RESIDENT',
  COLLECTOR = 'COLLECTOR',
  POINT = 'POINT',
  PRODUCER = 'PRODUCER',
  CONSUMER = 'CONSUMER'
}

export enum RequestStatus {
  PENDING = 'PENDING',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL', // Coletor aceitou, aguardando morador
  COLLECTOR_ASSIGNED = 'COLLECTOR_ASSIGNED', // Morador aprovou o coletor
  COLLECTED = 'COLLECTED', // Coleta realizada
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED'
}

export interface EcoService {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterRegion: string;
  providerId?: string;
  providerName?: string;
  title: string;
  description: string;
  category: string;
  aiSuggestedPrice: number;
  negotiatedPrice: number;
  requesterOffer: number;
  providerOffer?: number;
  agreedScope?: string;
  agreementStatus: 'WAITING_PROVIDER' | 'NEGOTIATING' | 'AGREED' | 'PAYMENT_DONE';
  status: 'OPEN' | 'ACCEPTED' | 'TAX_PAID' | 'SCHEDULED' | 'COMPLETED' | 'CANCELED';
  schedule?: {
    date: string;
    time: string;
    location: string;
    isRemote: boolean;
  };
  timestamp: number;
}

export interface EcoCause {
  id: string;
  title: string;
  description: string;
  category: 'REFLORESTAMENTO' | 'FAUNA' | 'LIMPEZA' | 'EDUCACAO';
  jackpotPoints: number;
  targetPoints: number;
  votersCount: number;
  icon: string;
}

export interface EcoMission {
  id: string;
  causeId: string;
  title: string;
  description: string;
  rewardPoints: number;
  location: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'VERIFYING' | 'COMPLETED';
  executorId?: string;
}

export interface EcoReport {
  id: string;
  userId: string;
  type: 'DESMATAMENTO' | 'CAÇA' | 'TRÁFICO' | 'INCÊNDIO' | 'OUTRO';
  description: string;
  location: { address: string; lat: number; lng: number };
  timestamp: number;
  status: 'PENDING' | 'REPORTED_TO_AUTHORITY' | 'VALIDATED' | 'REWARD_PAID';
  potentialReward: number;
  evidenceUrl?: string;
  needsSupport?: boolean;
  supporters?: string[];
}

export interface WildlifeSighting {
  id: string;
  userId: string;
  species: string;
  location: { address: string; lat: number; lng: number };
  timestamp: number;
  photoUrl?: string;
  revenueEarned?: number;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  roles: UserRole[];
  activeRole: UserRole;
  balance: number;
  points: number;
  totalRecycledKg: number;
  region: string;
  energyMetrics?: any;
  consumerMetrics?: any;
  totalSightingRevenue?: number;
}

export interface PlasticDeclaration {
  id: string;
  residentId: string;
  residentName?: string;
  type: string;
  quantity: number;
  estimatedWeight: number;
  location: { address: string; lat: number; lng: number };
  status: RequestStatus;
  estimatedValue: number;
  collectorId?: string;
  collectorName?: string;
  pointId?: string;
  actualWeight?: number;
  timestamp?: number;
  isGuaranteed?: boolean;
}
