
import React, { useState, useEffect } from 'react';
import { User, PlasticDeclaration, RequestStatus } from '../types';
import { cloud } from '../services/cloudService';

interface PointDashboardProps {
  user: User;
}

const PointDashboard: React.FC<PointDashboardProps> = ({ user }) => {
  const [offers, setOffers] = useState<PlasticDeclaration[]>([]);
  const [searchId, setSearchId] = useState('');
  const [showEnergyStats, setShowEnergyStats] = useState(false);

  useEffect(() => {
    setOffers(cloud.getOffers());
    const handleSync = () => setOffers(cloud.getOffers());
    window.addEventListener('cloud_update', handleSync);
    return () => window.removeEventListener('cloud_update', handleSync);
  }, []);

  const handleValidate = (id: string) => {
    const offer = offers.find(o => o.id === id);
    if (offer && offer.status !== RequestStatus.COMPLETED) {
      const amountToResident = offer.estimatedValue * 0.7;
      const amountToCollector = offer.estimatedValue * 0.3;
      if (cloud.transferFunds(user.id, offer.residentId, amountToResident)) {
        if (offer.collectorId) cloud.transferFunds(user.id, offer.collectorId, amountToCollector);
        cloud.updateOffer(id, { status: RequestStatus.COMPLETED });
        alert('Transação Liquidada!');
        setSearchId('');
      }
    }
  };

  const energy = user.energyMetrics;
  const bill = user.consumerMetrics?.currentBill;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* HEADER DE CAPITAL (ROXO) */}
      <section className="bg-[#a855f7] p-10 rounded-[3.5rem] shadow-2xl shadow-purple-500/20 relative overflow-hidden">
         <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
         <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Capital Operacional</p>
         <h2 className="text-4xl font-black text-white tracking-tighter">R$ {user.balance.toFixed(2)}</h2>
         
         {/* ATALHO ENERGY CLOUD PARA O PONTO */}
         <div className="mt-10 bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <i className="fas fa-bolt-lightning text-amber-400"></i>
               <div>
                  <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Custo Energético</p>
                  <p className="text-sm font-black text-white">R$ {bill?.originalValue.toFixed(2)}</p>
               </div>
            </div>
            <button 
              onClick={() => setShowEnergyStats(!showEnergyStats)}
              className="bg-white text-purple-600 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg"
            >
              {showEnergyStats ? 'Ver Compras' : 'Eficiência'}
            </button>
         </div>
      </section>

      {showEnergyStats && energy && (
        <section className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-6 animate-slide-up shadow-xl">
           <div className="flex justify-between items-center">
              <h4 className="text-sm font-black text-white uppercase tracking-tight">Consumo do Hub</h4>
              <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Ativo</span>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Geração Compensada</p>
                 <p className="text-lg font-black text-white">{energy.dailyKwh} kWh</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Economia Mensal</p>
                 <p className="text-lg font-black text-emerald-400">R$ 142.50</p>
              </div>
           </div>
           <button className="w-full bg-blue-600 text-white h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Comprar mais Créditos</button>
        </section>
      )}

      {/* VALIDAÇÃO DE OFERTAS */}
      <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6">
         <div className="text-center">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Validar Liquidação</h3>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Insira o código da oferta</p>
         </div>
         <div className="flex gap-2">
            <input 
              value={searchId}
              onChange={e => setSearchId(e.target.value.toUpperCase())}
              placeholder="ECO-XXXX"
              className="flex-1 bg-slate-50 p-5 rounded-2xl font-black text-xs outline-none border border-slate-100 focus:border-purple-200 transition-all"
            />
            <button 
              onClick={() => handleValidate(searchId)}
              className="bg-purple-600 text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95"
            >
              OK
            </button>
         </div>
      </section>

      {/* LISTA DE PENDENTES */}
      <div className="space-y-4">
         <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2">Cargas em Trânsito para este Ponto</h4>
         {offers.filter(o => o.status === RequestStatus.COLLECTED).map(o => (
           <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-truck"></i>
                 </div>
                 <div>
                    <p className="text-sm font-black text-slate-800 uppercase">{o.type}</p>
                    <p className="text-[10px] font-bold text-slate-400">Em transporte por {o.collectorId || 'Autônomo'}</p>
                 </div>
              </div>
              <p className="text-sm font-black text-slate-800">R$ {o.estimatedValue.toFixed(2)}</p>
           </div>
         ))}
      </div>
    </div>
  );
};

export default PointDashboard;
