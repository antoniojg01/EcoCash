import React, { useState, useEffect } from 'react';
import { User, PlasticDeclaration, RequestStatus } from '../types';
import { cloud } from '../services/cloudService';

interface PointDashboardProps {
  user: User;
}

const PointDashboard: React.FC<PointDashboardProps> = ({ user }) => {
  const [offers, setOffers] = useState<PlasticDeclaration[]>([]);
  const [searchId, setSearchId] = useState('');

  useEffect(() => {
    setOffers(cloud.getOffers());
    const handleSync = () => setOffers(cloud.getOffers());
    window.addEventListener('cloud_update', handleSync);
    return () => window.removeEventListener('cloud_update', handleSync);
  }, []);

  const handleValidate = (id: string) => {
    const offer = offers.find(o => o.id === id);
    if (offer) {
      if (offer.status === RequestStatus.COMPLETED) {
        alert('Esta oferta já foi liquidada anteriormente.');
        return;
      }
      
      const amountToResident = offer.estimatedValue * 0.7;
      const amountToCollector = offer.estimatedValue * 0.3;

      const success = cloud.transferFunds(user.id, offer.residentId, amountToResident);
      if (success) {
        if (offer.collectorId) {
          cloud.transferFunds(user.id, offer.collectorId, amountToCollector);
        }
        cloud.updateOffer(id, { status: RequestStatus.COMPLETED });
        alert(`Transação Liquidada!\nMorador: +R$ ${amountToResident.toFixed(2)}\nColetor: +R$ ${amountToCollector.toFixed(2)}`);
        setSearchId('');
      } else {
        alert('Saldo insuficiente para liquidar!');
      }
    } else {
      alert('Código de oferta não encontrado.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* CARD DE CAPITAL - DESIGN FIEL AO SCREENSHOT (ROXO SUAVE) */}
      <section className="bg-gradient-to-br from-[#d8b4fe] to-[#a855f7] p-8 rounded-[3rem] shadow-[0_20px_50px_-10px_rgba(168,85,247,0.25)] relative overflow-hidden h-56 flex flex-col justify-center transition-all">
         {/* Elementos de fundo sutil */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
         <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-900/10 rounded-full -ml-8 -mb-8 blur-xl"></div>
         
         <div className="relative z-10 space-y-3">
            <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
               <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Capital Disponível</p>
            </div>
            <h2 className="text-5xl font-black text-white tracking-tighter leading-none">
               R${user.balance.toFixed(2)}
            </h2>
         </div>
      </section>

      {/* SEÇÃO DE LIQUIDAÇÃO - DESIGN CLEAN DO SCREENSHOT */}
      <section className="bg-white p-8 rounded-[3rem] shadow-[0_15px_35px_rgba(0,0,0,0.01)] border border-slate-50 space-y-6">
         <div className="text-center">
            <h3 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Liquidar Oferta (ID)</h3>
         </div>
         
         <div className="relative flex items-center bg-[#f1f5f9]/60 p-2.5 rounded-[2.2rem] border border-slate-100/50 group transition-all focus-within:bg-white focus-within:border-[#d8b4fe]/50 focus-within:shadow-md">
            <input 
              type="text" 
              value={searchId} 
              onChange={e => setSearchId(e.target.value.toUpperCase())}
              placeholder="Ex: ECO-A1B2"
              className="flex-1 bg-transparent px-5 py-3.5 font-black text-slate-600 outline-none text-xs placeholder:text-slate-300"
            />
            <button 
              onClick={() => handleValidate(searchId)}
              disabled={!searchId.trim()}
              className="bg-gradient-to-r from-[#d8b4fe] to-[#a855f7] text-white px-8 h-14 rounded-[1.6rem] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-100 active:scale-95 transition-all disabled:opacity-40"
            >
              Validar
            </button>
         </div>
      </section>

      {/* HISTÓRICO - TEXTO E REFINAMENTO */}
      <section className="px-1 space-y-4">
         <div className="flex items-center justify-between px-4">
            <h3 className="text-[9px] font-black text-slate-200 uppercase tracking-[0.25em]">Histórico de Transações em Nuvem</h3>
         </div>
         
         <div className="bg-white/50 rounded-[3rem] border border-slate-50 py-12 flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 border border-slate-50">
               <i className="fas fa-cloud-upload text-slate-100 text-xl"></i>
            </div>
            <p className="text-[8px] font-black text-slate-200 uppercase tracking-[0.2em]">Sem atividades recentes</p>
         </div>
      </section>
    </div>
  );
};

export default PointDashboard;