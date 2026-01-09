
export enum UserRole {
  RESIDENT = 'RESIDENT',
  COLLECTOR = 'COLLECTOR',
  POINT = 'POINT'
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  COLLECTOR_ASSIGNED = 'COLLECTOR_ASSIGNED',
  COLLECTED = 'COLLECTED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED'
}

export interface PlasticDeclaration {
  id: string;
  residentId: string;
  type: string;
  quantity: number; // in items or units
  estimatedWeight: number; // in kg
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
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  balance: number;
  totalRecycledKg: number;
}

export interface PointConfig {
  acceptedMaterials: string[];
  pricePerKg: Record<string, number>;
}
