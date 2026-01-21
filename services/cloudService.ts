
import { db, isFirebaseEnabled } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  getDocs,
  onSnapshot,
  increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { User, UserRole, PlasticDeclaration, EcoService, EcoCause, EcoMission, EcoReport, WildlifeSighting } from '../types';

class CloudService {
  private useFirebase = isFirebaseEnabled;

  private getLocal(key: string): any[] {
    const data = localStorage.getItem(`ecocash_${key}`);
    return data ? JSON.parse(data) : [];
  }

  private setLocal(key: string, data: any[]) {
    localStorage.setItem(`ecocash_${key}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('cloud_update'));
  }

  async createUserProfile(uid: string, data: Partial<User>) {
    const roles = data.roles || [UserRole.RESIDENT];
    const initialData: User = {
      id: uid,
      name: data.name || "Novo Usuário",
      roles: roles,
      activeRole: roles[0],
      role: roles[0],
      balance: 0,
      points: 100,
      totalRecycledKg: 0,
      region: data.region || "Sudeste",
      totalSightingRevenue: 0,
      consumerMetrics: {
        currentBill: { originalValue: 350, dueDate: "15/05/2026", status: 'PENDING' }
      },
      energyMetrics: {
        level: 1,
        systemCapacityKwp: 5.5,
        currentKw: 2.3,
        dailyKwh: 12.4,
        creditsBalance: 450,
        pendingAssignments: []
      }
    };

    if (this.useFirebase) {
      await setDoc(doc(db, "users", uid), initialData);
    } else {
      const users = this.getLocal('users');
      const existingIdx = users.findIndex(u => u.id === uid);
      if (existingIdx === -1) {
        users.push(initialData);
      } else {
        users[existingIdx] = { ...users[existingIdx], ...initialData };
      }
      this.setLocal('users', users);
    }
    return initialData;
  }

  async switchActiveRole(uid: string, newRole: UserRole) {
    if (this.useFirebase) {
      await updateDoc(doc(db, "users", uid), { activeRole: newRole, role: newRole });
    } else {
      const users = this.getLocal('users');
      const idx = users.findIndex(u => u.id === uid);
      if (idx !== -1) {
        users[idx].activeRole = newRole;
        users[idx].role = newRole;
        this.setLocal('users', users);
      }
    }
  }

  async getUser(uid: string): Promise<User | null> {
    if (this.useFirebase) {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        return snap.exists() ? snap.data() as User : null;
      } catch (e) {
        return null;
      }
    } else {
      const users = this.getLocal('users');
      return users.find(u => u.id === uid) || null;
    }
  }

  async getUsers(): Promise<User[]> {
    if (this.useFirebase) {
      const snap = await getDocs(query(collection(db, "users")));
      return snap.docs.map(d => d.data() as User);
    } else {
      return this.getLocal('users');
    }
  }

  subscribeToUser(uid: string, callback: (user: User | null) => void) {
    if (this.useFirebase) {
      return onSnapshot(doc(db, "users", uid), (snap) => {
        callback(snap.exists() ? snap.data() as User : null);
      });
    } else {
      const check = () => {
        const users = this.getLocal('users');
        const user = users.find(u => u.id === uid);
        callback(user || null);
      };
      check();
      window.addEventListener('cloud_update', check);
      window.addEventListener('storage', check);
      return () => {
        window.removeEventListener('cloud_update', check);
        window.removeEventListener('storage', check);
      };
    }
  }

  getMarketAnalytics() {
    return {
      treasury: 12450.80,
      totalTransactions: 1422,
      totalReports: 28,
      totalSightingRevenueDist: 8450.00,
      regionStats: [
        { region: 'Sudeste', avgPrice: 0.28, count: 42, totalKwh: 12500 },
        { region: 'Nordeste', avgPrice: 0.30, count: 28, totalKwh: 8900 },
        { region: 'Sul', avgPrice: 0.26, count: 35, totalKwh: 10200 }
      ]
    };
  }

  async earnPoints(userId: string, amount: number, reason: string) {
    if (this.useFirebase) {
      await updateDoc(doc(db, "users", userId), { points: increment(amount) });
    } else {
      const users = this.getLocal('users');
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        users[idx].points += amount;
        this.setLocal('users', users);
      }
    }
  }

  async buyPoints(userId: string, brlAmount: number) {
    if (this.useFirebase) {
      await updateDoc(doc(db, "users", userId), { 
        points: increment(brlAmount * 100),
        balance: increment(-brlAmount)
      });
    } else {
      const users = this.getLocal('users');
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        users[idx].points += (brlAmount * 100);
        users[idx].balance -= brlAmount;
        this.setLocal('users', users);
      }
    }
  }

  async voteForCause(userId: string, causeId: string, points: number) {
    if (this.useFirebase) {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().points >= points) {
        await updateDoc(userRef, { points: increment(-points) });
        await updateDoc(doc(db, "causes", causeId), { 
          jackpotPoints: increment(points),
          votersCount: increment(1)
        });
        return true;
      }
    } else {
      const users = this.getLocal('users');
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1 && users[idx].points >= points) {
        users[idx].points -= points;
        this.setLocal('users', users);
        const causes = this.getLocal('causes');
        const cIdx = causes.findIndex(c => c.id === causeId);
        if (cIdx !== -1) {
          causes[cIdx].jackpotPoints += points;
          causes[cIdx].votersCount += 1;
          this.setLocal('causes', causes);
        }
        return true;
      }
    }
    return false;
  }

  async getCauses(): Promise<EcoCause[]> {
    if (this.useFirebase) {
      const snap = await getDocs(query(collection(db, "causes")));
      return snap.empty ? this.getMockCauses() : snap.docs.map(d => d.data() as EcoCause);
    } else {
      const causes = this.getLocal('causes');
      return causes.length > 0 ? causes : this.getMockCauses();
    }
  }

  private getMockCauses(): EcoCause[] {
    const mocks: EcoCause[] = [
      { id: 'c1', title: 'Reflorestamento Mata Atlântica', description: 'Plantio de mudas nativas em áreas degradadas.', category: 'REFLORESTAMENTO', jackpotPoints: 12000, targetPoints: 50000, votersCount: 42, icon: 'fa-tree' },
      { id: 'c2', title: 'Limpeza de Praias', description: 'Mutirão de limpeza no litoral norte.', category: 'LIMPEZA', jackpotPoints: 8500, targetPoints: 20000, votersCount: 88, icon: 'fa-water' }
    ];
    if (!this.useFirebase) this.setLocal('causes', mocks);
    return mocks;
  }

  async createService(serviceData: any) {
    const newService = {
      ...serviceData,
      id: `SRV-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'OPEN',
      agreementStatus: 'WAITING_PROVIDER',
      timestamp: Date.now()
    };
    if (this.useFirebase) {
      await setDoc(doc(collection(db, "services")), newService);
    } else {
      const services = this.getLocal('services');
      services.push(newService);
      this.setLocal('services', services);
    }
    return newService;
  }

  async getServices(): Promise<EcoService[]> {
    if (this.useFirebase) {
      const snap = await getDocs(query(collection(db, "services")));
      return snap.docs.map(d => d.data() as EcoService);
    } else {
      return this.getLocal('services');
    }
  }

  async acceptServiceInitial(userId: string, userName: string, serviceId: string, scope?: string) {
    if (this.useFirebase) {
      await updateDoc(doc(db, "services", serviceId), {
        providerId: userId,
        providerName: userName,
        status: 'ACCEPTED',
        agreementStatus: 'NEGOTIATING',
        agreedScope: scope || ''
      });
    } else {
      const services = this.getLocal('services');
      const idx = services.findIndex(s => s.id === serviceId);
      if (idx !== -1) {
        services[idx].providerId = userId;
        services[idx].providerName = userName;
        services[idx].status = 'ACCEPTED';
        services[idx].agreementStatus = 'NEGOTIATING';
        services[idx].agreedScope = scope || '';
        this.setLocal('services', services);
      }
    }
  }

  async makeCounterOffer(serviceId: string, amount: number, isProvider: boolean, scope?: string) {
    if (this.useFirebase) {
      const update: any = { negotiatedPrice: amount };
      if (isProvider) {
        update.providerOffer = amount;
        if (scope) update.agreedScope = scope;
      } else {
        update.requesterOffer = amount;
      }
      await updateDoc(doc(db, "services", serviceId), update);
    } else {
      const services = this.getLocal('services');
      const idx = services.findIndex(s => s.id === serviceId);
      if (idx !== -1) {
        services[idx].negotiatedPrice = amount;
        if (isProvider) {
          services[idx].providerOffer = amount;
          if (scope) services[idx].agreedScope = scope;
        } else {
          services[idx].requesterOffer = amount;
        }
        this.setLocal('services', services);
      }
    }
  }

  async acceptPrice(serviceId: string, userId: string) {
    if (this.useFirebase) {
      await updateDoc(doc(db, "services", serviceId), { agreementStatus: 'AGREED' });
    } else {
      const services = this.getLocal('services');
      const idx = services.findIndex(s => s.id === serviceId);
      if (idx !== -1) {
        services[idx].agreementStatus = 'AGREED';
        this.setLocal('services', services);
      }
    }
  }

  async payService(serviceId: string, userId: string) {
    if (this.useFirebase) {
      const sSnap = await getDoc(doc(db, "services", serviceId));
      const uSnap = await getDoc(doc(db, "users", userId));
      if (sSnap.exists() && uSnap.exists()) {
        const price = sSnap.data().negotiatedPrice;
        if (uSnap.data().balance >= price) {
          await updateDoc(doc(db, "users", userId), { balance: increment(-price) });
          await updateDoc(doc(db, "services", serviceId), { status: 'TAX_PAID' });
          return true;
        }
      }
    } else {
      const users = this.getLocal('users');
      const services = this.getLocal('services');
      const uIdx = users.findIndex(u => u.id === userId);
      const sIdx = services.findIndex(s => s.id === serviceId);
      if (uIdx !== -1 && sIdx !== -1) {
        const price = services[sIdx].negotiatedPrice;
        if (users[uIdx].balance >= price) {
          users[uIdx].balance -= price;
          services[sIdx].status = 'TAX_PAID';
          this.setLocal('users', users);
          this.setLocal('services', services);
          return true;
        }
      }
    }
    return false;
  }

  async scheduleService(serviceId: string, schedule: any) {
    if (this.useFirebase) {
      await updateDoc(doc(db, "services", serviceId), { status: 'SCHEDULED', schedule });
    } else {
      const services = this.getLocal('services');
      const idx = services.findIndex(s => s.id === serviceId);
      if (idx !== -1) {
        services[idx].status = 'SCHEDULED';
        services[idx].schedule = schedule;
        this.setLocal('services', services);
      }
    }
  }

  async completeAndRelease(serviceId: string) {
    if (this.useFirebase) {
      const sSnap = await getDoc(doc(db, "services", serviceId));
      if (sSnap.exists()) {
        const data = sSnap.data();
        const fee = data.negotiatedPrice * 0.05;
        await updateDoc(doc(db, "users", data.providerId), { balance: increment(data.negotiatedPrice - fee) });
        await updateDoc(doc(db, "services", serviceId), { status: 'COMPLETED' });
        return true;
      }
    } else {
      const services = this.getLocal('services');
      const idx = services.findIndex(s => s.id === serviceId);
      if (idx !== -1) {
        const data = services[idx];
        const users = this.getLocal('users');
        const pIdx = users.findIndex(u => u.id === data.providerId);
        if (pIdx !== -1) {
          const fee = data.negotiatedPrice * 0.05;
          users[pIdx].balance += (data.negotiatedPrice - fee);
          data.status = 'COMPLETED';
          this.setLocal('users', users);
          this.setLocal('services', services);
          return true;
        }
      }
    }
    return false;
  }

  async createOffer(offerData: any) {
    if (this.useFirebase) {
      await setDoc(doc(collection(db, "offers")), { ...offerData, id: `OFF-${Date.now()}`, timestamp: Date.now() });
    } else {
      const offers = this.getLocal('offers');
      offers.push({ ...offerData, id: `OFF-${Date.now()}`, timestamp: Date.now() });
      this.setLocal('offers', offers);
    }
  }

  async getOffers(): Promise<PlasticDeclaration[]> {
    if (this.useFirebase) {
      const snap = await getDocs(query(collection(db, "offers")));
      return snap.docs.map(d => d.data() as PlasticDeclaration);
    } else {
      return this.getLocal('offers');
    }
  }

  async updateOffer(id: string, data: Partial<PlasticDeclaration>) {
    if (this.useFirebase) {
      await updateDoc(doc(db, "offers", id), data);
    } else {
      const offers = this.getLocal('offers');
      const idx = offers.findIndex(o => o.id === id);
      if (idx !== -1) {
        offers[idx] = { ...offers[idx], ...data };
        this.setLocal('offers', offers);
      }
    }
  }

  async createReport(report: any) {
    if (this.useFirebase) {
      await setDoc(doc(collection(db, "reports")), { ...report, id: `REP-${Date.now()}` });
    } else {
      const reports = this.getLocal('reports');
      reports.push({ ...report, id: `REP-${Date.now()}` });
      this.setLocal('reports', reports);
    }
  }

  async createSighting(sighting: any) {
    const rev = Math.random() * 5 + 2;
    if (this.useFirebase) {
      await updateDoc(doc(db, "users", sighting.userId), { totalSightingRevenue: increment(rev), balance: increment(rev) });
      await setDoc(doc(collection(db, "sightings")), { ...sighting, id: `WIT-${Date.now()}`, revenueEarned: rev });
    } else {
      const users = this.getLocal('users');
      const idx = users.findIndex(u => u.id === sighting.userId);
      if (idx !== -1) {
        users[idx].totalSightingRevenue += rev;
        users[idx].balance += rev;
        this.setLocal('users', users);
        const sightings = this.getLocal('sightings');
        sightings.push({ ...sighting, id: `WIT-${Date.now()}`, revenueEarned: rev });
        this.setLocal('sightings', sightings);
      }
    }
  }

  async getReports(): Promise<EcoReport[]> {
    if (this.useFirebase) {
      const snap = await getDocs(query(collection(db, "reports")));
      return snap.docs.map(d => d.data() as EcoReport);
    } else {
      return this.getLocal('reports');
    }
  }

  async getSightings(): Promise<WildlifeSighting[]> {
    if (this.useFirebase) {
      const snap = await getDocs(query(collection(db, "sightings")));
      return snap.docs.map(d => d.data() as WildlifeSighting);
    } else {
      return this.getLocal('sightings');
    }
  }

  async addEvidenceToReport(userId: string, reportId: string) {
    if (this.useFirebase) {
      await updateDoc(doc(db, "reports", reportId), { supporters: increment(1), status: 'VALIDATED' });
    } else {
      const reports = this.getLocal('reports');
      const idx = reports.findIndex(r => r.id === reportId);
      if (idx !== -1) {
        reports[idx].supporters = (reports[idx].supporters || 0) + 1;
        reports[idx].status = 'VALIDATED';
        this.setLocal('reports', reports);
      }
    }
    return true;
  }

  async injectEnergyToCredits(userId: string, amount: number) {
    if (this.useFirebase) {
      const uSnap = await getDoc(doc(db, "users", userId));
      if (uSnap.exists()) {
        const region = uSnap.data().region;
        const price = this.getProducerPrice(region);
        await updateDoc(doc(db, "users", userId), { "energyMetrics.creditsBalance": increment(amount), balance: increment(amount * price) });
      }
    } else {
      const users = this.getLocal('users');
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        const price = this.getProducerPrice(users[idx].region);
        users[idx].energyMetrics.creditsBalance += amount;
        users[idx].balance += (amount * price);
        this.setLocal('users', users);
      }
    }
  }

  async autoBuyCredits(userId: string, kwh: number): Promise<{ success: boolean; msg?: string }> {
    const total = (kwh * 0.3) / 0.9;
    try {
      if (this.useFirebase) {
        await updateDoc(doc(db, "users", userId), { "consumerMetrics.currentBill.status": 'PAID', balance: increment(-total) });
      } else {
        const users = this.getLocal('users');
        const idx = users.findIndex(u => u.id === userId);
        if (idx !== -1) {
          users[idx].consumerMetrics.currentBill.status = 'PAID';
          users[idx].balance -= total;
          this.setLocal('users', users);
        } else {
          return { success: false, msg: "Usuário não encontrado no sistema local." };
        }
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, msg: error.message || "Falha ao processar pagamento de créditos." };
    }
  }

  async completeAssignment(userId: string, assignmentId: string) { return true; }

  getMissions(): EcoMission[] {
    return [{ id: 'm1', causeId: 'c1', title: 'Plantio de 50 Mudas', description: 'Ajudar no cercamento.', rewardPoints: 500, location: 'Serra do Mar', status: 'OPEN' }];
  }

  async transferFunds(fromId: string, toId: string, amount: number) {
    if (this.useFirebase) {
      await updateDoc(doc(db, "users", fromId), { balance: increment(-amount) });
      await updateDoc(doc(db, "users", toId), { balance: increment(amount) });
    } else {
      const users = this.getLocal('users');
      const fIdx = users.findIndex(u => u.id === fromId);
      const tIdx = users.findIndex(u => u.id === toId);
      if (fIdx !== -1 && tIdx !== -1) {
        users[fIdx].balance -= amount;
        users[tIdx].balance += amount;
        this.setLocal('users', users);
      }
    }
    return true;
  }

  getProducerPrice(region: string) { return 0.28; }
  getDistributorPrice(region: string) { return 0.85; }
}

export const cloud = new CloudService();
