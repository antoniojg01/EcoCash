
import React, { useState, useEffect } from 'react';
import { User, PlasticDeclaration, RequestStatus, EcoMission } from '../types';
import { cloud } from '../services/cloudService';

interface CollectorDashboardProps {
  user: User;
}

const CollectorDashboard: React.FC<CollectorDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'available' | 'ongoing' | 'energy'>('available');
  const [missions, setMissions] = useState<EcoMission[]>([]);
  const [offers, setOffers] = useState<PlasticDeclaration[]>([]);

  // Fix: Handling async cloud.getOffers() correctly in useEffect
  useEffect(() => {
    const fetchInitialData = async () => {
      const allOffers = await cloud.getOffers();
      setOffers(allOffers);
    };
    fetchInitialData();

    const handleSync = async () => {
      const allOffers = await cloud.getOffers();
      setOffers(allOffers);
      setMissions(cloud.getMissions());
    };
    window.addEventListener('cloud_update', handleSync);
    return () => window.removeEventListener('cloud_update', handleSync);
  }, []);

  const handleConvertEnergy = () => {
    const amount = parseFloat(prompt('Quanto do seu saldo quer converter em créditos solar? (R$)') || '0');
    if (amount > 0 && amount <= user.balance) {
      const bonus = amount * 0.05;
      const total = amount + bonus;
      alert(`Conversão Realizada! R$ ${amount.toFixed(2)} + R$ ${bonus.toFixed(2)} bônus = R$ ${total.toFixed(2)} em créditos solar aplicados na sua próxima fatura.`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* MENU DE NAVEGAÇÃO INTERNA */}
      <div className="flex bg-slate-100 p-1.5 rounded-full border border-slate-200">
        {(['available', 'ongoing', 'energy'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[9px] font-black rounded-full transition-all uppercase tracking-widest ${
              activeTab === tab ? 'bg-white shadow-md text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'available' ? 'Cargas' : tab === 'ongoing' ? 'Em Rota' : 'Eco-Energia'}
          </button>
        ))}
      </div>

      {activeTab === 'energy' && (
        <div className="space-y-8 animate-slide-up">
           <section className="bg-blue-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Logística Sustentável</p>
              <h3 className="text-3xl font-black mt-2">Poupe sua <br/>Conta de Luz</h3>
              <p className="text-[11px] font-bold text-blue-100 mt-4 leading-relaxed">
                Coletores registrados recebem 5% de bônus ao converter saldo de coletas em créditos de energia solar.
              </p>
              
              <div className="mt-10 bg-black/20 p-6 rounded-3xl border border-white/5 flex justify-between items-center">
                 <div>
                    <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest mb-1">Seu Saldo Conversível</p>
                    <p className="text-2xl font-black text-white">R$ {user.balance.toFixed(2)}</p>
                 </div>
                 <button 
                   onClick={handleConvertEnergy}
                   className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95"
                 >
                   Converter
                 </button>
              </div>
           </section>

           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                    <i className="fas fa-sun"></i>
                 </div>
                 <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Status Solar</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Reserva Ativa em {user.region}</p>
                 </div>
              </div>
              <div className="h-[1px] bg-slate-50 w-full"></div>
              <div className="flex justify-between items-center">
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Próxima Fatura Estimada</p>
                 <p className="text-sm font-black text-emerald-500">R$ {user.consumerMetrics?.currentBill?.originalValue.toFixed(2)}</p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'available' && (
        <div className="space-y-4">
          {offers.filter(o => o.status === RequestStatus.PENDING).map(o => (
            <div key={o.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
               <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Carga Disponível</p>
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{o.type}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-blue-600">R$ {(o.estimatedValue * 0.3).toFixed(2)}</p>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Seu Ganho</p>
                  </div>
               </div>
               <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                  <i className="fas fa-location-dot text-blue-500"></i>
                  <p className="text-[10px] font-bold text-slate-500 truncate">{o.location.address}</p>
               </div>
               <button className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Aceitar Coleta</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectorDashboard;
