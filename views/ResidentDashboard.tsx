
import React, { useState, useEffect } from 'react';
import { User, RequestStatus, PlasticDeclaration } from '../types';
import { cloud } from '../services/cloudService';
import { estimateWeightAndValue } from '../services/geminiService';

interface ResidentDashboardProps {
  user: User;
}

const ResidentDashboard: React.FC<ResidentDashboardProps> = ({ user }) => {
  const [showDeclare, setShowDeclare] = useState(false);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [type, setType] = useState('PET');
  const [offers, setOffers] = useState<PlasticDeclaration[]>([]);

  useEffect(() => {
    setOffers(cloud.getOffers().filter(o => o.residentId === user.id));
    const handleSync = () => setOffers(cloud.getOffers().filter(o => o.residentId === user.id));
    window.addEventListener('cloud_update', handleSync);
    return () => window.removeEventListener('cloud_update', handleSync);
  }, [user.id]);

  const handleDeclare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const estimate = await estimateWeightAndValue(description, type);
    
    const newOffer: PlasticDeclaration = {
      id: `ECO-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      residentId: user.id,
      type,
      quantity: 1,
      estimatedWeight: estimate.estimatedWeight,
      estimatedValue: estimate.estimatedWeight * 1.5, // Preço base em nuvem
      location: { address: 'Rua das Palmeiras, 300', lat: -23.55, lng: -46.63 },
      status: RequestStatus.PENDING
    };

    cloud.createOffer(newOffer);
    setLoading(false);
    setShowDeclare(false);
    setDescription('');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Saldo em Nuvem */}
      <section className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-emerald-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-50 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10">
          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] mb-4">Saldo em Nuvem</p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-gray-400">R$</span>
            <h2 className="text-5xl font-black text-gray-900 tracking-tighter">{user.balance.toFixed(2)}</h2>
          </div>
          <div className="mt-8 flex gap-4">
             <button onClick={() => setShowDeclare(true)} className="flex-1 bg-gray-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Vender Material</button>
             <button className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl shadow-inner"><i className="fas fa-wallet"></i></button>
          </div>
        </div>
      </section>

      {/* Ofertas Ativas */}
      <section>
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 ml-2">Minhas Ofertas Ativas</h3>
        <div className="grid gap-4">
          {offers.length === 0 ? (
            <div className="p-20 text-center bg-gray-50 rounded-[2.5rem] border-4 border-dashed border-gray-100">
               <i className="fas fa-recycle text-gray-200 text-6xl mb-6"></i>
               <p className="text-gray-300 font-black uppercase text-[10px] tracking-widest">Nenhuma oferta criada</p>
            </div>
          ) : offers.map(o => (
            <div key={o.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-lg">
                    <i className="fas fa-box"></i>
                 </div>
                 <div>
                    <h4 className="font-black text-gray-900">{o.type} • {o.estimatedWeight}kg</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{o.id}</p>
                 </div>
              </div>
              <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 ${
                o.status === RequestStatus.PENDING ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
              }`}>
                {o.status === RequestStatus.PENDING ? 'Pendente' : 'Coletado'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal Simples */}
      {showDeclare && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[100] flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-[3rem] p-8 animate-slide-up">
             <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-black">Vender Plástico</h2>
               <button onClick={() => setShowDeclare(false)} className="bg-gray-100 w-10 h-10 rounded-2xl"><i className="fas fa-times"></i></button>
             </div>
             <form onSubmit={handleDeclare} className="space-y-6">
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  placeholder="O que você tem para vender?"
                  className="w-full bg-gray-50 border-2 border-gray-100 p-6 rounded-3xl h-32 outline-none focus:border-emerald-500 font-bold"
                  required
                />
                <button disabled={loading} className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-black shadow-2xl border-b-8 border-emerald-800">
                  {loading ? 'Calculando...' : 'PUBLICAR NA NUVEM'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentDashboard;
