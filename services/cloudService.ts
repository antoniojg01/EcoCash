
import { User, UserRole, PlasticDeclaration, RequestStatus } from '../types';

const STORAGE_KEY = 'ecocash_cloud_db';

interface CloudDB {
  users: User[];
  offers: PlasticDeclaration[];
}

const INITIAL_DB: CloudDB = {
  users: [
    { id: 'u_resident', name: 'João Silva', role: UserRole.RESIDENT, balance: 50.00, totalRecycledKg: 12.5 },
    { id: 'u_collector', name: 'Carlos Motoboy', role: UserRole.COLLECTOR, balance: 142.50, totalRecycledKg: 45.0 },
    { id: 'u_point', name: 'EcoPoint Central', role: UserRole.POINT, balance: 1250.00, totalRecycledKg: 1200.0 }
  ],
  offers: [
    {
      id: 'ECO-9921',
      residentId: 'u_resident',
      type: 'PET',
      quantity: 1,
      estimatedWeight: 8,
      estimatedValue: 14.40,
      location: { address: 'Rua das Flores, 55', lat: -23.55, lng: -46.63 },
      status: RequestStatus.APPROVED
    }
  ]
};

class CloudService {
  private db: CloudDB;

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    this.db = saved ? JSON.parse(saved) : INITIAL_DB;
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    window.dispatchEvent(new Event('cloud_update'));
  }

  getUsers() { return this.db.users; }
  
  getUser(id: string) { return this.db.users.find(u => u.id === id); }

  updateUser(id: string, data: Partial<User>) {
    this.db.users = this.db.users.map(u => u.id === id ? { ...u, ...data } : u);
    this.save();
  }

  getOffers() { return this.db.offers; }

  createOffer(offer: PlasticDeclaration) {
    this.db.offers.push(offer);
    this.save();
  }

  updateOffer(id: string, data: Partial<PlasticDeclaration>) {
    this.db.offers = this.db.offers.map(o => o.id === id ? { ...o, ...data } : o);
    this.save();
  }

  transferFunds(fromId: string, toId: string, amount: number) {
    const from = this.getUser(fromId);
    const to = this.getUser(toId);
    if (from && to && from.balance >= amount) {
      this.updateUser(fromId, { balance: from.balance - amount });
      this.updateUser(toId, { balance: to.balance + amount });
      return true;
    }
    return false;
  }
}

export const cloud = new CloudService();
