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
      location: { address: 'Endereço Sincronizado', lat: -23.55, lng: -46.63 },
      status: RequestStatus.PENDING,
      isGuaranteed: true
    };

    cloud.createOffer(newOffer);
    setBag([]);
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* SEÇÃO DA SACOLA REFINADA */}
      <section className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm flex flex-col items-center">
        <h3 className="text-base font-extrabold text-slate-800 tracking-tight text-center">Sacola de Recicláveis</h3>
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 mb-6 text-center">
          O que você tem para hoje?
        </p>

        <div className="w-full relative flex items-center">
           <input 
             value={itemInput}
             onChange={e => setItemInput(e.target.value)}
             placeholder="Ex: 5kg de papelão, 10 latas..."
             className="w-full bg-slate-50 border-none p-4 pr-16 rounded-2xl font-bold text-xs outline-none transition-all placeholder:text-slate-300 placeholder:font-medium"
             onKeyPress={(e) => e.key === 'Enter' && handleAddToBag()}
           />
           <button 
             onClick={handleAddToBag}
             disabled={loading || !itemInput.trim()}
             className="absolute right-2 w-10 h-10 bg-slate-200 text-slate-500 rounded-xl flex items-center justify-center active:scale-95 transition-all disabled:opacity-20"
           >
             {loading ? <i className="fas fa-circle-notch animate-spin text-xs"></i> : <i className="fas fa-plus text-xs"></i>}
           </button>
        </div>

        {bag.length > 0 && (
          <div className="w-full mt-4 space-y-3 animate-slide-up">
            <div className="max-h-32 overflow-y-auto hide-scrollbar space-y-2 pr-1">
              {bag.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-slate-50/50 p-3 rounded-xl">
                  <div className="text-left flex-1 min-w-0 mr-4">
                    <p className="text-[10px] font-bold text-slate-600 truncate uppercase">{item.description}</p>
                    <p className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Est: R$ {item.value.toFixed(2)}</p>
                  </div>
                  <button onClick={() => handleRemoveItem(item.id)} className="text-slate-300 hover:text-red-400">
                    <i className="fas fa-times-circle text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
            
            <div className="bg-[#059669] p-4 rounded-2xl text-white flex justify-between items-center shadow-lg shadow-emerald-50">
              <div className="text-left">
                <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">Total Estimado</p>
                <p className="text-lg font-black">R$ {totalBagValue.toFixed(2)}</p>
              </div>
              <button 
                onClick={handleFinishSale}
                className="bg-white text-emerald-600 px-4 py-2 rounded-xl font-bold text-[9px] uppercase tracking-widest active:scale-95 transition-all"
              >
                Vender
              </button>
            </div>
          </div>
        )}
      </section>

      {/* HISTÓRICO REFINADO - FIEL À IMAGEM */}
      <div className="space-y-4">
        <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] px-1">Suas Atividades Recentes</h4>
        <div className="space-y-3">
          {offers.map(o => (
            <div key={o.id} className="bg-white p-4 rounded-[1.8rem] border border-slate-50 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <i className="fas fa-clock text-base"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-black text-slate-800 text-[12px] truncate uppercase">{o.type}</h5>
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-0.5">{o.id} • {o.estimatedWeight.toFixed(1)}KG</p>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-black text-slate-900">R$ {o.estimatedValue.toFixed(2)}</p>
                <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest mt-1">APPROVED</p>
              </div>
            </div>
          ))}
          {offers.length === 0 && (
            <div className="py-12 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
              <i className="fas fa-leaf text-2xl mb-3 text-emerald-100"></i>
              <p className="text-[8px] font-black uppercase text-slate-300 tracking-widest">Nada por aqui</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;