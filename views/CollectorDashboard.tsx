
// ... (Importações existentes)
import React, { useState, useEffect, useMemo } from 'react';
import { User, PlasticDeclaration, RequestStatus, EcoMission } from '../types';
import { cloud } from '../services/cloudService';
import { findNearbyRecyclingPoints } from '../services/geminiService';

interface CollectorDashboardProps {
  user: User;
}

const CollectorDashboard: React.FC<CollectorDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'available' | 'ongoing' | 'missions'>('available');
  const [missions, setMissions] = useState<EcoMission[]>([]);
  // ... (Estados e lógica anterior mantidos)

  const [offers, setOffers] = useState<PlasticDeclaration[]>([]);
  const [confirmedWeight, setConfirmedWeight] = useState<string>('');
  const [activeReceipt, setActiveReceipt] = useState<PlasticDeclaration | null>(null);

  useEffect(() => {
    setMissions(cloud.getMissions());
    setOffers(cloud.getOffers());
    const handleSync = () => {
      setMissions(cloud.getMissions());
      setOffers(cloud.getOffers());
    };
    window.addEventListener('cloud_update', handleSync);
    return () => window.removeEventListener('cloud_update', handleSync);
  }, []);

  const handleAcceptMission = (id: string) => {
    if (cloud.acceptMission(user.id, id)) {
      alert('Missão aceita! Siga para o local e envie as provas após conclusão.');
      setActiveTab('ongoing');
    }
  };

  const handleCompleteMission = (id: string) => {
    if (cloud.completeMission(id)) {
      alert('Missão concluída! O valor foi creditado em seu saldo (R$ +10% taxa plataforma retida).');
    }
  };

  const ongoingMissions = missions.filter(m => m.executorId === user.id && m.status !== 'COMPLETED');

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex bg-[#F8FAFC] p-2 rounded-full shadow-sm">
        {(['available', 'ongoing', 'missions'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-[9px] font-black rounded-full transition-all uppercase tracking-[0.15em] ${
              activeTab === tab ? 'bg-white shadow-md text-blue-500' : 'text-slate-300 hover:text-slate-400'
            }`}
          >
            {tab === 'available' ? 'Cargas' : tab === 'ongoing' ? 'Em Curso' : 'Missões Sociais'}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'missions' && (
          <div className="space-y-8">
            <div className="bg-emerald-600 p-8 rounded-[3rem] text-white space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Fundo Social Disponível</p>
              <h3 className="text-3xl font-black">R$ {cloud.getMarketAnalytics().treasury.toFixed(2)}</h3>
              <p className="text-[9px] font-bold leading-relaxed">Estes valores vêm da conversão de EcoPoints da comunidade para financiar ações diretas.</p>
            </div>

            {missions.filter(m => m.status === 'OPEN').map(m => (
              <div key={m.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                <div>
                   <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-lg uppercase tracking-widest">Missão Social</span>
                   <h4 className="text-xl font-black text-slate-800 tracking-tight mt-3">{m.title}</h4>
                   <p className="text-[11px] font-medium text-slate-400 mt-2">{m.description}</p>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl">
                   <div>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Recompensa Líquida</p>
                      <p className="text-2xl font-black text-emerald-600">R$ {(m.rewardPoints / 100 * 0.9).toFixed(2)}</p>
                   </div>
                   <button 
                     onClick={() => handleAcceptMission(m.id)}
                     className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95"
                   >
                     Aceitar
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ... (Resto dos renders de available e ongoing mantendo lógica anterior mas incluindo missões no ongoing) */}
        {activeTab === 'ongoing' && (
          <div className="space-y-8">
            {ongoingMissions.map(m => (
              <div key={m.id} className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100 space-y-6">
                <h4 className="text-xl font-black text-emerald-900 uppercase">{m.title}</h4>
                <div className="flex items-center gap-3 text-emerald-600">
                   <i className="fas fa-location-dot"></i>
                   <span className="text-[11px] font-black uppercase tracking-widest">{m.location}</span>
                </div>
                <button 
                  onClick={() => handleCompleteMission(m.id)}
                  className="w-full h-16 bg-emerald-600 text-white rounded-full font-black text-[11px] uppercase tracking-widest shadow-xl"
                >
                  Concluir & Receber Pix
                </button>
              </div>
            ))}
            {/* ... (Render das coletas normais) */}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectorDashboard;
