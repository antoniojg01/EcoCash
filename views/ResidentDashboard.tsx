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
  const [offers, setOffers] = useState<PlasticDeclaration[]>([]);

  useEffect(() => {
    const handleSync = () => setOffers(cloud.getOffers().filter(o => o.residentId === user.id));
    handleSync();
    window.addEventListener('cloud_update', handleSync);
    return () => window.removeEventListener('cloud_update', handleSync);
  }, [user.id]);

  const handleDeclare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const estimate = await estimateWeightAndValue(description, "Mix de Plásticos");
    
    const newOffer: PlasticDeclaration = {
      id: `ECO-${Math.floor(1000 + Math.random() * 9000)}`,
      residentId: user.id,
      type: description,
      quantity: 1,
      estimatedWeight: estimate.estimatedWeight,
      estimatedValue: estimate.estimatedWeight * 2.5,
      location: { address: 'Rua de Exemplo, 123', lat: -23, lng: -46 },
      status: RequestStatus.PENDING,
      isGuaranteed: Math.random() > 0.5
    };

    cloud.createOffer(newOffer);
    setLoading(false);
    setShowDeclare(false);
    setDescription('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="bg-slate-50 p-6 rounded-[2.2rem] border border-slate-100 text-center space-y-4">
        <div className="w-14 h-14 bg-white text-emerald-600 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-sm border border-slate-100">
          <i className="fas fa-plus"></i>
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-slate-800 text-base">Vender material</h3>
          <p className="text-[11px] text-slate-400 font-medium">Anuncie agora e receba via EcoCloud.</p>
        </div>
        <button onClick={() => setShowDeclare(true)} className="w-full bg-[#1e293b] text-white py-4 rounded-2xl font-extrabold uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-md">Novo Anúncio</button>
      </section>

      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">Suas Ofertas Ativas</h4>

      <div className="space-y-4">
        {offers.map(o => (
          <div key={o.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${
              o.status === RequestStatus.PENDING ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <i className={`fas ${o.status === RequestStatus.PENDING ? 'fa-clock' : 'fa-check'}`}></i>
            </div>
            <div className="flex-1 overflow-hidden">
              <h5 className="font-extrabold text-slate-800 text-[14px] leading-tight truncate">{o.type}</h5>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{o.id} • {o.estimatedWeight}kg</p>
            </div>
            <div className="text-right">
               <p className="text-sm font-black text-slate-900">R$ {o.estimatedValue.toFixed(2)}</p>
               <p className="text-[8px] font-extrabold text-amber-500 uppercase tracking-widest mt-0.5">{o.status}</p>
            </div>
          </div>
        ))}
        {offers.length === 0 && (
          <div className="py-12 text-center opacity-30">
            <i className="fas fa-box-open text-3xl mb-3"></i>
            <p className="text-[9px] font-black uppercase tracking-widest">Nenhuma oferta no momento</p>
          </div>
        )}
      </div>

      {showDeclare && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100] flex items-end animate-fade-in">
          <div className="bg-white w-full rounded-t-[2.5rem] p-8 animate-slide-up pb-12 border-t border-slate-100">
            <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-8"></div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">O que você tem?</h2>
              <button onClick={() => setShowDeclare(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"><i className="fas fa-times"></i></button>
            </div>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: 10 garrafas PET, 5kg de papelão..." 
              className="w-full bg-slate-50 border border-slate-100 p-5 rounded-3xl h-32 outline-none font-bold text-sm text-slate-900 resize-none mb-6 placeholder:text-slate-300"
            />
            <button disabled={loading} onClick={handleDeclare} className="w-full bg-[#059669] text-white py-5 rounded-[2rem] font-extrabold uppercase text-[11px] tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
              {loading ? <i className="fas fa-sync-alt animate-spin"></i> : <i className="fas fa-cloud-upload"></i>}
              {loading ? 'Calculando...' : 'Publicar Anúncio'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentDashboard;