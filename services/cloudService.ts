
import { User, UserRole, PlasticDeclaration, RequestStatus, EcoCause, EcoMission, EcoReport, WildlifeSighting, EcoService } from '../types';

const STORAGE_KEY = 'ecocash_cloud_db_v10';

interface CloudDB {
  users: User[];
  offers: PlasticDeclaration[];
  causes: EcoCause[];
  missions: EcoMission[];
  reports: EcoReport[];
  sightings: WildlifeSighting[];
  services: EcoService[];
  platformTreasury: number;
  lastRevenueDistDate: number;
}

const INITIAL_DB: CloudDB = {
  platformTreasury: 4520.80,
  lastRevenueDistDate: Date.now(),
  users: [
    { id: 'u_resident', name: 'João Silva', role: UserRole.RESIDENT, balance: 500.00, points: 450, totalRecycledKg: 12.5, region: 'Sudeste', consumerMetrics: { currentBill: { originalValue: 85.00, status: 'PENDING', dueDate: '15/05' } } },
    { id: 'u_collector', name: 'Carlos Coletor', role: UserRole.COLLECTOR, balance: 142.50, points: 1200, totalRecycledKg: 45.0, region: 'Sudeste', consumerMetrics: { currentBill: { originalValue: 45.00, status: 'PENDING', dueDate: '10/05' } } },
    { id: 'u_point', name: 'EcoPoint Central', role: UserRole.POINT, balance: 1250.00, points: 5000, totalRecycledKg: 1200.0, region: 'Sudeste', energyMetrics: { dailyKwh: 45.2 }, consumerMetrics: { currentBill: { originalValue: 350.00, status: 'PENDING', dueDate: '20/05' } } }
  ],
  offers: [],
  causes: [
    { id: 'c1', title: 'Reflorestamento Mata Atlântica', description: 'Plantio de mudas nativas em áreas degradadas no litoral paulista.', category: 'REFLORESTAMENTO', jackpotPoints: 45000, targetPoints: 100000, votersCount: 152, icon: 'fa-tree' },
    { id: 'c2', title: 'Limpeza de Praias', description: 'Mutirão de limpeza e conscientização em praias do Nordeste.', category: 'LIMPEZA', jackpotPoints: 12000, targetPoints: 50000, votersCount: 89, icon: 'fa-water' }
  ],
  missions: [],
  reports: [
    { id: 'SOS-001', userId: 'u_resident', type: 'DESMATAMENTO', description: 'Desmatamento detectado em área de preservação.', location: { address: 'Reserva Legal Sul', lat: -23.5, lng: -46.6 }, timestamp: Date.now(), status: 'PENDING', potentialReward: 5000, needsSupport: true, supporters: [] }
  ],
  sightings: [],
  services: []
};

class CloudService {
  private db: CloudDB;

  constructor() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      this.db = saved ? JSON.parse(saved) : INITIAL_DB;
    } catch (e) {
      this.db = INITIAL_DB;
    }
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    window.dispatchEvent(new Event('cloud_update'));
  }

  getUsers() { return this.db.users; }
  getUser(id: string) { return this.db.users.find(u => u.id === id); }
  getServices() { return this.db.services; }

  createService(service: Omit<EcoService, 'id' | 'status' | 'timestamp' | 'agreementStatus'>) {
    const newService: EcoService = {
      ...service,
      id: `SRV-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'OPEN',
      agreementStatus: 'WAITING_PROVIDER',
      timestamp: Date.now()
    };
    this.db.services.push(newService);
    this.save();
    return newService;
  }

  makeCounterOffer(serviceId: string, amount: number, isProvider: boolean, scope?: string) {
    const service = this.db.services.find(s => s.id === serviceId);
    if (!service) return;
    if (isProvider) {
      service.providerOffer = amount;
      if (scope) service.agreedScope = scope;
    } else {
      service.requesterOffer = amount;
    }
    service.agreementStatus = 'NEGOTIATING';
    this.save();
  }

  acceptPrice(serviceId: string, userId: string) {
    const service = this.db.services.find(s => s.id === serviceId);
    if (!service) return;
    
    if (service.providerId === userId) {
      service.negotiatedPrice = service.requesterOffer;
    } else {
      service.negotiatedPrice = service.providerOffer || service.requesterOffer;
    }
    service.agreementStatus = 'AGREED';
    this.save();
  }

  payService(serviceId: string, userId: string) {
    const service = this.db.services.find(s => s.id === serviceId);
    const user = this.getUser(userId);
    if (!service || !user || user.balance < service.negotiatedPrice) return false;

    user.balance -= service.negotiatedPrice;
    this.db.platformTreasury += service.negotiatedPrice;
    service.status = 'TAX_PAID';
    service.agreementStatus = 'PAYMENT_DONE';
    this.save();
    return true;
  }

  completeAndRelease(serviceId: string) {
    const service = this.db.services.find(s => s.id === serviceId);
    if (!service || !service.providerId || service.status !== 'SCHEDULED') return false;

    const feePercent = 0.05;
    const platformCut = service.negotiatedPrice * feePercent;
    const providerGain = service.negotiatedPrice - platformCut;

    const provider = this.getUser(service.providerId);
    if (provider) {
      provider.balance += providerGain;
      this.db.platformTreasury -= providerGain;
      service.status = 'COMPLETED';
      this.save();
      return true;
    }
    return false;
  }

  scheduleService(serviceId: string, data: EcoService['schedule']) {
    const service = this.db.services.find(s => s.id === serviceId);
    if (service && service.status === 'TAX_PAID') {
      service.schedule = data;
      service.status = 'SCHEDULED';
      this.save();
    }
  }

  updateServiceStatus(serviceId: string, status: EcoService['status']) {
    const service = this.db.services.find(s => s.id === serviceId);
    if (service) {
      service.status = status;
      this.save();
    }
  }

  acceptServiceInitial(userId: string, userName: string, serviceId: string, scope?: string) {
    const service = this.db.services.find(s => s.id === serviceId);
    if (!service || service.status !== 'OPEN') return false;
    service.providerId = userId;
    service.providerName = userName;
    service.status = 'ACCEPTED';
    if (scope) service.agreedScope = scope;
    this.save();
    return true;
  }

  transferFunds(fromId: string, toId: string, amount: number) {
    const fromUser = this.getUser(fromId);
    const toUser = this.getUser(toId);
    if (!fromUser || !toUser || fromUser.balance < amount) return false;
    fromUser.balance -= amount;
    toUser.balance += amount;
    this.save();
    return true;
  }

  getOffers() { return this.db.offers; }
  createOffer(offer: PlasticDeclaration) {
    this.db.offers.push(offer);
    this.save();
  }

  updateOffer(id: string, updates: Partial<PlasticDeclaration>) {
    this.db.offers = this.db.offers.map(o => o.id === id ? { ...o, ...updates } : o);
    this.save();
  }

  earnPoints(userId: string, amount: number, reason: string) {
    const user = this.getUser(userId);
    if (!user) return;
    user.points += amount;
    this.save();
  }

  buyPoints(userId: string, amount: number) {
    const user = this.getUser(userId);
    if (!user || user.balance < amount) return;
    user.balance -= amount;
    user.points += amount * 100;
    this.save();
  }

  getCauses() { return this.db.causes; }
  voteForCause(userId: string, causeId: string, amount: number) {
    const user = this.getUser(userId);
    const cause = this.db.causes.find(c => c.id === causeId);
    if (!user || !cause || user.points < amount) return false;
    user.points -= amount;
    cause.jackpotPoints += amount;
    cause.votersCount += 1;
    this.save();
    return true;
  }

  getMissions() { return this.db.missions; }
  getReports() { return this.db.reports; }
  createReport(report: EcoReport) {
    this.db.reports.push(report);
    this.save();
  }

  getSightings() { return this.db.sightings; }
  createSighting(sighting: WildlifeSighting) {
    const revenue = Math.random() * 5 + 2;
    sighting.revenueEarned = revenue;
    this.db.sightings.push(sighting);
    const user = this.getUser(sighting.userId);
    if (user) {
      user.totalSightingRevenue = (user.totalSightingRevenue || 0) + revenue;
      user.balance += revenue;
    }
    this.save();
  }

  addEvidenceToReport(userId: string, reportId: string) {
    const report = this.db.reports.find(r => r.id === reportId);
    if (!report) return false;
    if (!report.supporters) report.supporters = [];
    if (!report.supporters.includes(userId)) {
      report.supporters.push(userId);
      this.save();
      return true;
    }
    return false;
  }
  
  getMarketAnalytics() {
    return {
      treasury: this.db.platformTreasury,
      totalTransactions: this.db.services.length,
      regionStats: [
        { region: 'Sudeste', avgPrice: 0.28, count: 42, totalKwh: 12500 },
        { region: 'Nordeste', avgPrice: 0.35, count: 28, totalKwh: 8900 }
      ],
      totalReports: this.db.reports.length,
      totalSightingRevenueDist: this.db.users.reduce((acc, u) => acc + (u.totalSightingRevenue || 0), 0)
    };
  }

  getProducerPrice(region: string) { return region === 'Nordeste' ? 0.35 : 0.28; }
  getDistributorPrice(region: string) { return region === 'Nordeste' ? 1.05 : 0.92; }

  injectEnergyToCredits(userId: string, amount: number) {
    const user = this.getUser(userId);
    if (!user || !user.energyMetrics) return;
    const price = this.getProducerPrice(user.region);
    user.balance += amount * price;
    user.energyMetrics.creditsBalance -= amount;
    this.save();
  }

  completeAssignment(userId: string, assignmentId: string) {
    const user = this.getUser(userId);
    if (!user || !user.energyMetrics) return;
    const assignment = user.energyMetrics.pendingAssignments?.find((a: any) => a.id === assignmentId);
    if (assignment) {
      assignment.status = 'COMPLETED';
      this.save();
    }
  }

  autoBuyCredits(userId: string, kwh: number) {
    const user = this.getUser(userId);
    if (!user) return { success: false, msg: 'Erro' };
    const cost = kwh * 0.90;
    if (user.balance < cost) return { success: false, msg: 'Sem saldo' };
    user.balance -= cost;
    this.save();
    return { success: true };
  }
}

export const cloud = new CloudService();
