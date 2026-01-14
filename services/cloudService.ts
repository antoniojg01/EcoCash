
import { User, UserRole, PlasticDeclaration, RequestStatus, EnergyMetrics, ConsumerMetrics, EnergyTransaction, BillAssignment } from '../types';

const STORAGE_KEY = 'ecocash_cloud_db_v4';

interface CloudDB {
  users: User[];
  offers: PlasticDeclaration[];
  transactions: EnergyTransaction[];
  platformTreasury: number;
}

const REGIONS = ['Sul', 'Sudeste', 'Nordeste', 'Centro-Oeste', 'Norte'];

const DISTRIBUTOR_KWH_PRICES: Record<string, number> = {
  'Sul': 0.92,
  'Sudeste': 1.05,
  'Nordeste': 0.88,
  'Centro-Oeste': 0.98,
  'Norte': 1.12
};

const REGIONAL_PRODUCER_VALUES: Record<string, number> = {
  'Sul': 0.22,
  'Sudeste': 0.25,
  'Nordeste': 0.20,
  'Centro-Oeste': 0.24,
  'Norte': 0.23
};

// Portais específicos para Geração Distribuída e Compensação
const REGIONAL_PORTALS: Record<string, string> = {
  'Sul': 'https://www.copel.com/hpcopel/root/nivel2.jsp?endereco=%2Fhpcopel%2Fgeracao_distribuida%2F',
  'Sudeste': 'https://servicosonline.cpfl.com.br/agencia-webapp/#/login', // CPFL / Bandeirante / Enel
  'Nordeste': 'https://www.neoenergiacoelba.com.br/residencial/geracao-distribuida',
  'Centro-Oeste': 'https://www.energisa.com.br/paginas/servicos/geracao-distribuida.aspx',
  'Norte': 'https://www.equatorialenergia.com.br/servicos/geracao-distribuida/'
};

const INITIAL_DB: CloudDB = {
  platformTreasury: 4520.80,
  users: [
    { id: 'u_resident', name: 'João Silva', role: UserRole.RESIDENT, balance: 50.00, totalRecycledKg: 12.5, region: 'Sudeste' },
    { id: 'u_collector', name: 'Carlos Coletor', role: UserRole.COLLECTOR, balance: 142.50, totalRecycledKg: 45.0, region: 'Sudeste' },
    { id: 'u_point', name: 'EcoPoint Central', role: UserRole.POINT, balance: 1250.00, totalRecycledKg: 1200.0, region: 'Sudeste' },
    { 
      id: 'u_producer', 
      name: 'João Solar', 
      role: UserRole.PRODUCER, 
      balance: 1450.50, 
      totalRecycledKg: 0,
      region: 'Sudeste',
      energyMetrics: {
        currentKw: 6.7,
        dailyKwh: 47.3,
        expectedTodayKwh: 85.5,
        systemCapacityKwp: 50,
        level: 'PRATA',
        creditsBalance: 4327,
        soldTodayKwh: 133,
        selfConsumptionKwh: 2160,
        pendingAssignments: []
      }
    },
    {
      id: 'u_consumer',
      name: 'Maria Santos',
      role: UserRole.CONSUMER,
      balance: 1000.00,
      totalRecycledKg: 0,
      region: 'Nordeste',
      consumerMetrics: {
        activeCredits: 0,
        totalSaved: 450.20,
        installationId: '8829-X-2025',
        currentBill: {
          originalValue: 340.00,
          discountedValue: 340.00,
          dueDate: '15/02/2026',
          consumptionKwh: 400,
          status: 'PENDING'
        }
      }
    }
  ],
  offers: [],
  transactions: []
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
      window.dispatchEvent(new Event('cloud_update'));
    } catch (e) {
      console.error("Erro ao salvar dados localmente.");
    }
  }

  getUsers() { return this.db.users; }
  getUser(id: string) { return this.db.users.find(u => u.id === id); }
  getDistributorPrice(region: string = 'Sudeste') { return DISTRIBUTOR_KWH_PRICES[region] || 1.00; }
  getProducerPrice(region: string = 'Sudeste') { return REGIONAL_PRODUCER_VALUES[region] || 0.22; }
  getRegionalPortal(region: string = 'Sudeste') { return REGIONAL_PORTALS[region] || 'https://www.google.com/search?q=compensação+créditos+energia'; }

  getOffers() { return this.db.offers; }

  createOffer(offer: PlasticDeclaration) {
    this.db.offers.push(offer);
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

  injectEnergyToCredits(userId: string, kwhAmount: number) {
    const user = this.getUser(userId);
    if (!user || user.role !== UserRole.PRODUCER || !user.energyMetrics) return { success: false };
    user.energyMetrics.creditsBalance += kwhAmount;
    this.save();
    return { success: true };
  }

  autoBuyCredits(consumerId: string, kwhAmount: number, commissionPercent: number = 0.15) {
    const consumer = this.getUser(consumerId);
    if (!consumer || !consumer.consumerMetrics) return { success: false, msg: 'Consumidor não encontrado' };

    const region = consumer.region || 'Sudeste';
    
    const producers = this.db.users
      .filter(u => u.role === UserRole.PRODUCER && u.energyMetrics && u.energyMetrics.creditsBalance >= kwhAmount)
      .sort((a, b) => (a.region === region ? -1 : 1));

    const producer = producers[0];
    if (!producer || !producer.energyMetrics) return { success: false, msg: 'Nenhum produtor disponível.' };

    const producerPrice = this.getProducerPrice(region);
    const amountToProducer = kwhAmount * producerPrice;
    const platformFee = amountToProducer * commissionPercent;
    const totalEcoCashCost = amountToProducer + platformFee;

    if (consumer.balance < totalEcoCashCost) return { success: false, msg: 'Saldo insuficiente.' };

    const distributorPrice = this.getDistributorPrice(region);
    const originalCost = kwhAmount * distributorPrice;
    const savings = originalCost - totalEcoCashCost;

    consumer.balance -= totalEcoCashCost;
    producer.balance += amountToProducer;
    this.db.platformTreasury += platformFee;
    
    const assignment: BillAssignment = {
      id: `BILL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      consumerName: consumer.name,
      installationId: consumer.consumerMetrics.installationId,
      kwhAmount: kwhAmount,
      platformFee: platformFee, // Salva a margem da empresa no histórico da transação
      status: 'PENDING',
      timestamp: Date.now()
    };
    
    if (!producer.energyMetrics.pendingAssignments) producer.energyMetrics.pendingAssignments = [];
    producer.energyMetrics.pendingAssignments.push(assignment);
    
    producer.energyMetrics.creditsBalance -= kwhAmount;
    producer.energyMetrics.soldTodayKwh += kwhAmount;

    consumer.consumerMetrics.activeCredits += kwhAmount;
    consumer.consumerMetrics.currentBill.status = 'PAID';

    this.save();
    return { 
      success: true, 
      producerName: producer.name,
      savings: savings,
      fee: platformFee
    };
  }

  completeAssignment(producerId: string, assignmentId: string) {
    const producer = this.getUser(producerId);
    if (producer && producer.energyMetrics?.pendingAssignments) {
      producer.energyMetrics.pendingAssignments = producer.energyMetrics.pendingAssignments.map(a => 
        a.id === assignmentId ? { ...a, status: 'COMPLETED' as const } : a
      );
      this.save();
      return true;
    }
    return false;
  }

  getMarketAnalytics() {
    const regionStats = REGIONS.map(region => {
      const usersInRegion = this.db.users.filter(u => u.region === region);
      const producers = usersInRegion.filter(u => u.role === UserRole.PRODUCER);
      const totalKwh = producers.reduce((acc, p) => acc + (p.energyMetrics?.soldTodayKwh || 0), 0);
      return {
        region,
        count: usersInRegion.length,
        avgPrice: this.getDistributorPrice(region),
        totalKwh
      };
    });

    return { 
      treasury: this.db.platformTreasury, 
      totalTransactions: this.db.offers.filter(o => o.status === RequestStatus.COMPLETED).length, 
      regionStats 
    };
  }
}

export const cloud = new CloudService();
