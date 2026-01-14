
export enum UserRole {
  RESIDENT = 'RESIDENT',
  COLLECTOR = 'COLLECTOR',
  POINT = 'POINT',
  PRODUCER = 'PRODUCER',
  CONSUMER = 'CONSUMER',
  INVESTOR = 'INVESTOR'
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  COLLECTOR_ASSIGNED = 'COLLECTOR_ASSIGNED',
  COLLECTED = 'COLLECTED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED'
}

export interface BillAssignment {
  id: string;
  consumerName: string;
  installationId: string;
  kwhAmount: number;
  platformFee: number; // Margem da empresa na transação
  status: 'PENDING' | 'COMPLETED';
  timestamp: number;
}

export interface EnergyTransaction {
  id: string;
  timestamp: number;
  region: string;
  kwhAmount: number;
  pricePerKwh: number;
  totalValue: number;
  hourOfDay: number;
}

export interface EnergyMetrics {
  currentKw: number;
  dailyKwh: number;
  expectedTodayKwh: number;
  systemCapacityKwp: number;
  level: 'BRONZE' | 'PRATA' | 'OURO' | 'DIAMANTE';
  creditsBalance: number;
  soldTodayKwh: number;
  selfConsumptionKwh: number;
  pendingAssignments?: BillAssignment[];
}

export interface ConsumerMetrics {
  activeCredits: number;
  totalSaved: number;
  currentBill: {
    originalValue: number;
    discountedValue: number;
    dueDate: string;
    consumptionKwh: number;
    status: 'PENDING' | 'PAID' | 'PROCESSING';
  };
  installationId: string;
}

export interface PlasticDeclaration {
  id: string;
  residentId: string;
  type: string;
  quantity: number;
  estimatedWeight: number;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  status: RequestStatus;
  estimatedValue: number;
  collectorId?: string;
  pointId?: string;
  actualWeight?: number;
  photoUrl?: string;
  isGuaranteed?: boolean;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  balance: number;
  totalRecycledKg: number;
  region?: string;
  energyMetrics?: EnergyMetrics;
  consumerMetrics?: ConsumerMetrics;
}
