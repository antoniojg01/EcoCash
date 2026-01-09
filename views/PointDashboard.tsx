
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
      // Liquidação em Nuvem: Ponto paga, Morador e Coletor recebem
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
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-purple-600 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-20"><i className="fas fa-shop text-6xl"></i></div>
         <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-4">Capital Disponível</p>
         <h2 className="text-5xl font-black tracking-tighter">R$ {user.balance.toFixed(2)}</h2>
      </section>

      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-purple-50">
         <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Liquidar Oferta (ID)</h3>
         <div className="flex gap-4">
            <input 
              type="text" 
              value={searchId} 
              onChange={e => setSearchId(e.target.value.toUpperCase())}
              placeholder="Ex: ECO-A1B2"
              className="flex-1 bg-gray-50 border-2 border-gray-100 p-5 rounded-2xl font-black outline-none focus:border-purple-500"
            />
            <button 
              onClick={() => handleValidate(searchId)}
              className="bg-purple-600 text-white px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl border-b-4 border-purple-800 active:translate-y-1 transition-all"
            >Validar</button>
         </div>
      </section>

      <section>
         <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 ml-2">Histórico de Transações em Nuvem</h3>
         <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100">
            <div className="p-10 text-center">
               <p className="text-gray-300 font-black text-[10px] uppercase tracking-widest">Sincronizado com servidor central</p>
            </div>
         </div>
      </section>
    </div>
  );
};

export default PointDashboard;
