
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
  const [address, setAddress] = useState('');
  const [bag, setBag] = useState<BagItem[]>([]);
  const [offers, setOffers] = useState<PlasticDeclaration[]>([]);

  // Fix: Handling async cloud.getOffers() correctly
  useEffect(() => {
    const fetchOffers = async () => {
      const allOffers = await cloud.getOffers();
      setOffers(allOffers.filter(o => o.residentId === user.id));
    };
    fetchOffers();
    // In a real scenario, cloud_update would trigger this
    window.addEventListener('cloud_update', fetchOffers);
    return () => window.removeEventListener('cloud_update', fetchOffers);
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

  const handleFinishSale = async () => {
    if (bag.length === 0 || !address.trim()) return;
    setLoading(true);
    const newOffer: PlasticDeclaration = {
      id: `ECO-${Math.floor(1000 + Math.random() * 9000)}`,
      residentId: user.id,
      type: bag.length === 1 ? bag[0].description : `${bag.length} materiais`,
      quantity: bag.length,
      estimatedWeight: totalBagWeight,
      estimatedValue: totalBagValue,
      location: { address: address.trim(), lat: -23.55, lng: -46.63 },
      status: RequestStatus.PENDING,
      isGuaranteed: true
    };
    await cloud.createOffer(newOffer);
    setBag([]);
    setAddress('');
    setLoading(false);
    // Trigger local update manually for UX
    const allOffers = await cloud.getOffers();
    setOffers(allOffers.filter(o => o.residentId === user.id));
  };

  const bill = user.consumerMetrics?.currentBill;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* WIDGET ENERGY CLOUD INTEGRADO */}
      {bill && (
        <section className="bg-blue-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
           <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
           <div className="flex justify-between items-start relative z-10">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Fatura de Energia</p>
                 <h4 className="text-2xl font-black mt-1">R$ {bill.originalValue.toFixed(2)}</h4>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                 <i className="fas fa-bolt-lightning text-amber-400"></i>
              </div>
           </div>
           <div className="mt-6 flex items-center justify-between relative z-10">
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">Vencimento: {bill.dueDate}</p>
              <button 
                disabled={user.balance < bill.originalValue}
                className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                  user.balance >= bill.originalValue ? 'bg-white text-blue-600 shadow-lg active:scale-95' : 'bg-blue-500/50 text-blue-200 cursor-not-allowed'
                }`}
              >
                {user.balance >= bill.originalValue ? 'Quitar com Saldo' : 'Saldo Insuficiente'}
              </button>
           </div>
           {user.balance < bill.originalValue && (
             <p className="text-[8px] font-bold text-blue-300 mt-3 text-center uppercase tracking-widest">
               Venda mais {( (bill.originalValue - user.balance) / 2.8 ).toFixed(1)}kg para quitar!
             </p>
           )}
        </section>
      )}

      {/* SACOLA DE RECICLÁVEIS */}
      <section className="bg-white px-8 py-10 rounded-[3rem] border border-slate-50 shadow-sm flex flex-col items-center">
        <h3 className="text-xl font-black text-slate-800 tracking-tight">Sacola de Recicláveis</h3>
        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.25em] mt-2 mb-8">O QUE VOCÊ TEM PARA HOJE?</p>

        <div className="w-full relative flex items-center">
           <input 
             value={itemInput}
             onChange={e => setItemInput(e.target.value)}
             placeholder="Ex: 5kg de papelão, 10 latas..."
             className="w-full bg-slate-50/50 border border-slate-100 p-5 pr-16 rounded-[1.8rem] font-bold text-xs outline-none focus:bg-white transition-all"
           />
           <button 
             onClick={handleAddToBag}
             disabled={loading}
             className="absolute right-2.5 w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center active:scale-95 shadow-lg"
           >
             <i className={`fas ${loading ? 'fa-circle-notch animate-spin' : 'fa-plus'} text-sm`}></i>
           </button>
        </div>

        {bag.length > 0 && (
          <div className="w-full mt-6 space-y-4 animate-slide-up">
            <div className="max-h-40 overflow-y-auto hide-scrollbar space-y-2.5">
              {bag.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-emerald-50/30 p-4 rounded-2xl border border-emerald-50">
                  <p className="text-[11px] font-black text-slate-700 uppercase">{item.description}</p>
                  <p className="text-[10px] font-black text-emerald-600">R$ {item.value.toFixed(2)}</p>
                </div>
              ))}
            </div>
            <input 
              placeholder="Endereço de retirada..."
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full bg-slate-50 p-4 rounded-2xl text-xs font-bold outline-none border border-slate-100"
            />
            <button 
              onClick={handleFinishSale}
              className="w-full bg-emerald-600 text-white h-16 rounded-full font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95"
            >
              Vender por R$ {totalBagValue.toFixed(2)}
            </button>
          </div>
        )}
      </section>

      {/* HISTÓRICO RECENTE */}
      <div className="space-y-4">
        {offers.map(o => (
          <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                  <i className="fas fa-box-open"></i>
               </div>
               <div>
                  <p className="text-sm font-black text-slate-800 uppercase">{o.type}</p>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{o.id}</p>
               </div>
            </div>
            <div className="text-right">
               <p className="text-sm font-black text-slate-800">R$ {o.estimatedValue.toFixed(2)}</p>
               <span className="text-[8px] font-black text-emerald-500 uppercase">{o.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResidentDashboard;
