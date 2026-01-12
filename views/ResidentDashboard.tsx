
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
      // IA estima o peso e valor do item individualmente
      const estimate = await estimateWeightAndValue(itemInput, "Reciclável Variado");
      
      const newItem: BagItem = {
        id: Math.random().toString(36).substr(2, 9),
        description: itemInput,
        weight: estimate.estimatedWeight,
        value: estimate.estimatedWeight * 2.8 // Valor base de R$ 2.80/kg
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
      type: bag.length === 1 ? bag[0].description : `${bag.length} tipos de materiais`,
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
    <div className="space-y-8 animate-fade-in pb-24">
      {/* SEÇÃO DA SACOLA */}
      <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col items-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 shadow-inner">
          <i className="fas fa-shopping-basket text-2xl"></i>
        </div>
        <h3 className="text-xl font-black text-slate-800 tracking-tight text-center">Sacola de Recicláveis</h3>
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-2 mb-8 text-center">
          {bag.length === 0 ? 'O que você tem para hoje?' : `${bag.length} materiais prontos`}
        </p>

        <div className="w-full space-y-4">
          <div className="flex gap-3">
             <input 
               value={itemInput}
               onChange={e => setItemInput(e.target.value)}
               placeholder="Ex: 5kg de papelão, 10 latas..."
               className="flex-1 bg-slate-50 border-2 border-transparent focus:border-emerald-500 p-5 rounded-[1.8rem] font-bold text-sm outline-none transition-all placeholder:text-slate-300"
               onKeyPress={(e) => e.key === 'Enter' && handleAddToBag()}
             />
             <button 
               onClick={handleAddToBag}
               disabled={loading || !itemInput.trim()}
               className="w-16 h-16 bg-slate-900 text-white rounded-[1.8rem] flex items-center justify-center active:scale-90 transition-all disabled:opacity-20 shadow-lg"
             >
               {loading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-plus"></i>}
             </button>
          </div>

          {bag.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-slate-50 animate-slide-up">
              <div className="max-h-48 overflow-y-auto hide-scrollbar space-y-2 pr-1">
                {bag.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-slate-50/80 p-4 rounded-2xl border border-slate-100/50">
                    <div className="text-left flex-1 min-w-0 mr-4">
                      <p className="text-[11px] font-black text-slate-700 truncate uppercase">{item.description}</p>
                      <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Est: R$ {item.value.toFixed(2)}</p>
                    </div>
                    <button onClick={() => handleRemoveItem(item.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
                      <i className="fas fa-times-circle text-sm"></i>
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="bg-emerald-600 p-6 rounded-[2.5rem] text-white flex justify-between items-center shadow-2xl shadow-emerald-100 mt-4">
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total da Sacola</p>
                  <p className="text-2xl font-black">R$ {totalBagValue.toFixed(2)}</p>
                </div>
                <button 
                  onClick={handleFinishSale}
                  className="bg-white text-emerald-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                >
                  Vender Lote
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* HISTÓRICO */}
      <div className="space-y-6">
        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">Suas Atividades Recentes</h4>
        <div className="space-y-4">
          {offers.map(o => (
            <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                o.status === RequestStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-500'
              }`}>
                <i className={`fas ${o.status === RequestStatus.COMPLETED ? 'fa-check-circle' : 'fa-clock opacity-50'} text-xl`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-black text-slate-800 text-[13px] truncate uppercase">{o.type}</h5>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{o.id} • {o.estimatedWeight.toFixed(1)}kg</p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-black text-slate-900 leading-none">R$ {o.estimatedValue.toFixed(2)}</p>
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-2">{o.status}</p>
              </div>
            </div>
          ))}
          {offers.length === 0 && (
            <div className="py-16 text-center opacity-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
              <i className="fas fa-leaf text-4xl mb-4 text-emerald-200"></i>
              <p className="text-[10px] font-black uppercase tracking-widest">Nada por aqui ainda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;
