import React, { useState, useEffect } from 'react';
import { User, RequestStatus, PlasticDeclaration } from '../types';
import { cloud } from '../services/cloudService';
import { estimateWeightAndValue } from '../services/geminiService';

interface ResidentDashboardProps {
  user: User;
}

interface BagItem {
  id: string;
  description: string;
  weight: number;
  value: number;
}

const ResidentDashboard: React.FC<ResidentDashboardProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [itemInput, setItemInput] = useState('');
  const [bag, setBag] = useState<BagItem[]>([]);
  const [offers, setOffers] = useState<PlasticDeclaration[]>([]);

  useEffect(() => {
    const handleSync = () => setOffers(cloud.getOffers().filter(o => o.residentId === user.id));
    handleSync();
    window.addEventListener('cloud_update', handleSync);
    return () => window.removeEventListener('cloud_update', handleSync);
  }, [user.id]);

  const totalBagValue = bag.reduce((acc, item) => acc + item.value, 0);
  const totalBagWeight = bag.reduce((acc, item) => acc + item.weight, 0);

  const handleAddToBag = async () => {
    if (!itemInput.trim()) return;
    setLoading(true);
    
    try {
      const estimate = await estimateWeightAndValue(itemInput, "Reciclável Variado");
      const newItem: BagItem = {
        id: Math.random().toString(36).substr(2, 9),
        description: itemInput,
        weight: estimate.estimatedWeight,
        value: estimate.estimatedWeight * 2.8
      };
      setBag(prev => [...prev, newItem]);
      setItemInput('');
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = (id: string) => {
    setBag(prev => prev.filter(item => item.id !== id));
  };

  const handleFinishSale = async () => {
    if (bag.length === 0) return;
    setLoading(true);

    const newOffer: PlasticDeclaration = {
      id: `ECO-${Math.floor(1000 + Math.random() * 9000)}`,
      residentId: user.id,
      type: bag.length === 1 ? bag[0].description : `${bag.length} materiais`,
      quantity: bag.length,
      estimatedWeight: totalBagWeight,
      estimatedValue: totalBagValue,
      location: { address: 'Rua das Reciclagens, 123', lat: -23.55, lng: -46.63 },
      status: RequestStatus.PENDING,
      isGuaranteed: true
    };

    cloud.createOffer(newOffer);
    setBag([]);
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* SACOLA DE RECICLÁVEIS - FIEL AO SCREENSHOT */}
      <section className="bg-white px-8 py-10 rounded-[3rem] border border-slate-50 shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col items-center">
        <h3 className="text-xl font-black text-slate-800 tracking-tight text-center">Sacola de Recicláveis</h3>
        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.25em] mt-2 mb-8 text-center opacity-70">
          O QUE VOCÊ TEM PARA HOJE?
        </p>

        <div className="w-full relative flex items-center">
           <input 
             value={itemInput}
             onChange={e => setItemInput(e.target.value)}
             placeholder="Ex: 5kg de papelão, 10 latas..."
             className="w-full bg-slate-50/50 border border-slate-100/50 p-5 pr-16 rounded-[1.8rem] font-bold text-xs outline-none transition-all placeholder:text-slate-300 placeholder:font-semibold focus:bg-white focus:border-emerald-200"
             onKeyPress={(e) => e.key === 'Enter' && handleAddToBag()}
           />
           <button 
             onClick={handleAddToBag}
             disabled={loading || !itemInput.trim()}
             className="absolute right-2.5 w-12 h-12 bg-slate-200 text-slate-500 rounded-2xl flex items-center justify-center active:scale-95 transition-all disabled:opacity-30 shadow-sm"
           >
             {loading ? <i className="fas fa-circle-notch animate-spin text-sm"></i> : <i className="fas fa-plus text-sm"></i>}
           </button>
        </div>

        {bag.length > 0 && (
          <div className="w-full mt-6 space-y-4 animate-slide-up">
            <div className="max-h-40 overflow-y-auto hide-scrollbar space-y-2.5">
              {bag.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-emerald-50/30 p-4 rounded-2xl border border-emerald-50/50">
                  <div className="text-left flex-1 min-w-0 mr-4">
                    <p className="text-[11px] font-black text-slate-700 truncate uppercase tracking-tight">{item.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{item.weight.toFixed(1)}kg</span>
                       <span className="text-[9px] font-bold text-emerald-300">•</span>
                       <span className="text-[9px] font-black text-emerald-500 uppercase">R$ {item.value.toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveItem(item.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors">
                    <i className="fas fa-times-circle text-sm"></i>
                  </button>
                </div>
              ))}
            </div>
            
            <div className="bg-[#059669] p-5 rounded-[2rem] text-white flex justify-between items-center shadow-xl shadow-emerald-100">
              <div className="text-left">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] opacity-60 mb-0.5">Total Estimado</p>
                <p className="text-2xl font-black tracking-tight">R$ {totalBagValue.toFixed(2)}</p>
              </div>
              <button 
                onClick={handleFinishSale}
                className="bg-white text-emerald-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg"
              >
                Vender Agora
              </button>
            </div>
          </div>
        )}
      </section>

      {/* HISTÓRICO REFINADO - ATIVIDADES RECENTES */}
      <div className="space-y-5 px-1">
        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] px-2">Suas Atividades Recentes</h4>
        <div className="space-y-4">
          {offers.map(o => (
            <div key={o.id} className="bg-white p-5 rounded-[2.2rem] border border-slate-50 flex items-center gap-5 shadow-sm hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm border border-amber-100/30 group-hover:scale-110 transition-transform">
                <i className="fas fa-clock text-lg"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-black text-slate-800 text-[13px] truncate uppercase tracking-tight">{o.type}</h5>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.15em] mt-1">{o.id} • {o.estimatedWeight.toFixed(1)}KG</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-slate-900 tracking-tight">R$ {o.estimatedValue.toFixed(2)}</p>
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1.5 opacity-80">APPROVED</p>
              </div>
            </div>
          ))}
          {offers.length === 0 && (
            <div className="py-16 text-center bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                <i className="fas fa-leaf text-2xl"></i>
              </div>
              <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.25em]">Nenhuma atividade ainda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;