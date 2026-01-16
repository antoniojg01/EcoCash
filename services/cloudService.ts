
import { User, UserRole, PlasticDeclaration, RequestStatus, EcoCause, EcoMission, EcoReport, WildlifeSighting } from '../types';

const STORAGE_KEY = 'ecocash_cloud_db_v8';

interface CloudDB {
  users: User[];
  offers: PlasticDeclaration[];
  causes: EcoCause[];
  missions: EcoMission[];
  reports: EcoReport[];
  sightings: WildlifeSighting[];
  platformTreasury: number;
  lastRevenueDistDate: number;
}

const INITIAL_DB: CloudDB = {
  platformTreasury: 4520.80,
  lastRevenueDistDate: Date.now(),
  users: [
    { id: 'u_resident', name: 'João Silva', role: UserRole.RESIDENT, balance: 50.00, points: 450, totalRecycledKg: 12.5, region: 'Sudeste', totalSightingRevenue: 120.50 },
    { id: 'u_collector', name: 'Carlos Coletor', role: UserRole.COLLECTOR, balance: 142.50, points: 1200, totalRecycledKg: 45.0, region: 'Sudeste' },
    { id: 'u_point', name: 'EcoPoint Central', role: UserRole.POINT, balance: 1250.00, points: 5000, totalRecycledKg: 1200.0, region: 'Sudeste' },
    { 
      id: 'u_producer', 
      name: 'Usina Solar Sol-Vivo', 
      role: UserRole.PRODUCER, 
      balance: 450.00, 
      points: 2500, 
      totalRecycledKg: 0, 
      region: 'Sudeste',
      energyMetrics: {
        level: 4,
        systemCapacityKwp: 12.5,
        currentKw: 8.4,
        dailyKwh: 42.1,
        creditsBalance: 1250,
        pendingAssignments: [
          { id: 'a1', consumerName: 'Edifício Horizonte', installationId: '9928374-1', kwhAmount: 450, platformFee: 67.50, status: 'PENDING' }
        ]
      }
    },
    { 
      id: 'u_consumer', 
      name: 'Maria Condomínio', 
      role: UserRole.CONSUMER, 
      balance: 120.00, 
      points: 800, 
      totalRecycledKg: 5.0, 
      region: 'Sudeste',
      consumerMetrics: {
        currentBill: {
          dueDate: '15/11/2023',
          originalValue: 350.00,
          discountedValue: 297.50,
          status: 'PENDING'
        }
      }
    }
  ],
  offers: [],
  causes: [
    { id: 'c1', title: 'Reflorestar Nascente Rio X', description: 'Recuperação da mata ciliar da principal nascente da região sul.', category: 'REFLORESTAMENTO', jackpotPoints: 12500, targetPoints: 50000, votersCount: 142, icon: 'fa-seedling' },
    { id: 'c2', title: 'Limpeza Orla Central', description: 'Mutirão para retirada de microplásticos da areia e restinga.', category: 'LIMPEZA', jackpotPoints: 8400, targetPoints: 20000, votersCount: 89, icon: 'fa-broom' }
  ],
  missions: [],
  reports: [
    { id: 'SOS-9921', userId: 'system', type: 'DESMATAMENTO', description: 'Atividade suspeita em APP', location: { address: 'Mata Sul, KM 42', lat: -23.1, lng: -46.2 }, timestamp: Date.now() - 100000, status: 'PENDING', potentialReward: 5000, needsSupport: true, supporters: [] }
  ],
  sightings: []
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
  getOffers() { return this.db.offers; }
  getCauses() { return this.db.causes; }
  getMissions() { return this.db.missions; }
  getReports() { return this.db.reports; }
  getSightings() { return this.db.sightings; }

  createReport(report: EcoReport) {
    this.db.reports.push(report);
    this.save();
  }

  addEvidenceToReport(userId: string, reportId: string) {
    const report = this.db.reports.find(r => r.id === reportId);
    if (!report) return false;
    if (!report.supporters) report.supporters = [];
    if (report.supporters.includes(userId)) return false;
    report.supporters.push(userId);
    this.earnPoints(userId, 100, 'Auxílio em Denúncia');
    this.save();
    return true;
  }

  createSighting(sighting: WildlifeSighting) {
    const simulatedRevenue = Math.random() * 5 + 2; 
    const updatedSighting = { ...sighting, revenueEarned: simulatedRevenue };
    this.db.sightings.push(updatedSighting);
    const user = this.getUser(sighting.userId);
    if (user) {
      user.totalSightingRevenue = (user.totalSightingRevenue || 0) + simulatedRevenue;
      user.balance += simulatedRevenue;
    }
    this.earnPoints(sighting.userId, 50, 'Avistamento Científico');
    this.save();
  }

  voteForCause(userId: string, causeId: string, points: number) {
    const user = this.getUser(userId);
    const cause = this.db.causes.find(c => c.id === causeId);
    if (!user || !cause || user.points < points) return false;
    user.points -= points;
    cause.jackpotPoints += points;
    cause.votersCount += 1;
    this.save();
    return true;
  }

  earnPoints(userId: string, amount: number, reason: string) {
    const user = this.getUser(userId);
    if (!user) return;
    user.points += amount;
    this.save();
  }

  buyPoints(userId: string, cashAmount: number) {
    const user = this.getUser(userId);
    if (!user || user.balance < cashAmount) return false;
    user.balance -= cashAmount;
    user.points += cashAmount * 100;
    this.save();
    return true;
  }

  acceptMission(userId: string, missionId: string) {
    const mission = this.db.missions.find(m => m.id === missionId);
    if (!mission || mission.status !== 'OPEN') return false;
    mission.status = 'IN_PROGRESS';
    mission.executorId = userId;
    this.save();
    return true;
  }

  completeMission(missionId: string) {
    const mission = this.db.missions.find(m => m.id === missionId);
    if (!mission || !mission.executorId) return false;
    const executor = this.getUser(mission.executorId);
    if (!executor) return false;
    const cashReward = (mission.rewardPoints / 100) * 0.9;
    executor.balance += cashReward;
    this.db.platformTreasury += (mission.rewardPoints / 100) * 0.1;
    mission.status = 'COMPLETED';
    this.save();
    return true;
  }

  createOffer(offer: PlasticDeclaration) {
    this.db.offers.push(offer);
    this.earnPoints(offer.residentId, Math.floor(offer.estimatedWeight * 10), 'Reciclagem');
    this.save();
  }

  updateOffer(id: string, updates: Partial<PlasticDeclaration>) {
    this.db.offers = this.db.offers.map(o => o.id === id ? { ...o, ...updates } : o);
    this.save();
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

  getMarketAnalytics() {
    const regionStats = [
      { region: 'Sudeste', count: 42, avgPrice: 0.28, totalKwh: 4500 },
      { region: 'Nordeste', count: 28, avgPrice: 0.35, totalKwh: 3200 },
      { region: 'Sul', count: 15, avgPrice: 0.26, totalKwh: 1200 }
    ];
    return {
      treasury: this.db.platformTreasury,
      totalVoters: this.db.causes.reduce((acc, c) => acc + c.votersCount, 0),
      activeMissions: this.db.missions.filter(m => m.status === 'OPEN').length,
      totalReports: this.db.reports.length,
      totalSightings: this.db.sightings.length,
      totalSightingRevenueDist: this.db.users.reduce((acc, u) => acc + (u.totalSightingRevenue || 0), 0),
      totalTransactions: this.db.offers.filter(o => o.status === RequestStatus.COMPLETED).length,
      regionStats
    };
  }

  getProducerPrice(region: string) {
    return region === 'Nordeste' ? 0.35 : 0.28;
  }

  getDistributorPrice(region: string) {
    return region === 'Nordeste' ? 1.05 : 0.92;
  }

  injectEnergyToCredits(userId: string, amount: number) {
    const user = this.getUser(userId);
    if (!user || !user.energyMetrics) return;
    user.energyMetrics.creditsBalance += amount;
    user.energyMetrics.dailyKwh += (amount / 30);
    this.save();
  }

  completeAssignment(userId: string, assignmentId: string) {
    const user = this.getUser(userId);
    if (!user || !user.energyMetrics) return;
    const a = user.energyMetrics.pendingAssignments.find((x: any) => x.id === assignmentId);
    if (a) a.status = 'COMPLETED';
    this.save();
  }

  autoBuyCredits(userId: string, kwh: number) {
    const user = this.getUser(userId);
    if (!user || !user.consumerMetrics) return { success: false, msg: 'Usuário não configurado' };
    const region = user.region || 'Sudeste';
    const prodPrice = this.getProducerPrice(region);
    const rawCost = kwh * prodPrice;
    const fee = rawCost * 0.15;
    
    if (user.balance < (rawCost + fee)) return { success: false, msg: 'Saldo insuficiente' };
    
    user.balance -= (rawCost + fee);
    user.consumerMetrics.currentBill.status = 'PAID';
    this.save();
    return { success: true, producerName: 'Usina Solar Sol-Vivo', savings: kwh * 0.12, fee: fee };
  }
}

export const cloud = new CloudService();
