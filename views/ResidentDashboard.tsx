
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

  const fetchOffers = async () => {
    const allOffers = await cloud.getOffers();
    setOffers(allOffers.filter(o => o.residentId === user.id));
  };

  useEffect(() => {
    fetchOffers();
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
    fetchOffers();
  };

  const handleApproveCollector = async (offerId: string) => {
    setLoading(true);
    try {
      await cloud.approveCollector(offerId);
      showToast("Venda aprovada! O coletor foi notificado.");
    } catch (e) {
      alert("Erro ao aprovar coletor.");
    } finally {
      setLoading(false);
      fetchOffers();
    }
  };

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-10 animate-fade-in pb-12 px-1 relative">
      {/* TOAST FEEDBACK */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up border border-white/10">
           <i className="fas fa-check-circle text-emerald-400"></i>
           <span className="text-[10px] font-black uppercase tracking-widest">{toast}</span>
        </div>
      )}

      {/* SACOLA DE RECICLÁVEIS */}
      <section className="bg-white/80 backdrop-blur-sm px-10 py-12 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col items-center">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Sacola de Recicláveis</h3>
        <p className="text-[10px] text-slate-300 font-extrabold uppercase tracking-[0.3em] mt-3 mb-10">O QUE VOCÊ TEM PARA HOJE?</p>

        <div className="w-full relative flex items-center mb-4">
           <input 
             value={itemInput}
             onChange={e => setItemInput(e.target.value)}
             placeholder="Ex: 5kg de papelão, 10 latas..."
             className="w-full bg-slate-50/50 border border-slate-100 p-6 pr-20 rounded-[2.5rem] font-bold text-sm outline-none focus:bg-white transition-all shadow-inner"
           />
           <button 
             onClick={handleAddToBag}
             disabled={loading}
             className="absolute right-3 w-14 h-14 bg-[#10b981]/40 text-white rounded-[1.8rem] flex items-center justify-center active:scale-95 shadow-lg backdrop-blur-sm"
           >
             <i className={`fas ${loading ? 'fa-circle-notch animate-spin' : 'fa-plus'} text-xl`}></i>
           </button>
        </div>

        {bag.length > 0 && (
          <div className="w-full mt-6 space-y-4 animate-slide-up">
            <div className="max-h-40 overflow-y-auto hide-scrollbar space-y-3">
              {bag.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-[#10b981]/5 p-5 rounded-3xl border border-[#10b981]/10">
                  <p className="text-xs font-black text-slate-700 uppercase">{item.description}</p>
                  <p className="text-xs font-black text-[#10b981]">R$ {item.value.toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
               <input 
                 placeholder="Endereço de retirada..."
                 value={address}
                 onChange={e => setAddress(e.target.value)}
                 className="w-full bg-slate-50 p-5 rounded-3xl text-sm font-bold outline-none border border-slate-100 shadow-inner"
               />
               <button 
                 onClick={handleFinishSale}
                 className="w-full bg-[#10b981] text-white h-20 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.25em] shadow-xl active:scale-95"
               >
                 Vender por R$ {totalBagValue.toFixed(2)}
               </button>
            </div>
          </div>
        )}
      </section>

      {/* SUAS OFERTAS */}
      <section className="bg-white/90 p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-8 animate-fade-in">
        <div className="px-2">
           <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-6">SUAS OFERTAS</h4>
        </div>

        <div className="space-y-6">
           {offers.length === 0 ? (
             <div className="py-20 flex flex-col items-center justify-center opacity-20">
                <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-4xl mb-4">
                   <i className="fas fa-receipt"></i>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Nenhuma oferta ativa</p>
             </div>
           ) : (
             offers.slice().reverse().map(o => (
               <div key={o.id} className="bg-white p-7 rounded-[3.5rem] border border-slate-50 shadow-sm space-y-6 group transition-all">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 ${o.status === RequestStatus.COMPLETED ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'} rounded-[1.8rem] flex items-center justify-center shadow-sm`}>
                           <i className={`fas ${o.status === RequestStatus.COMPLETED ? 'fa-check-double' : 'fa-box-open'} text-xl`}></i>
                        </div>
                        <div>
                           <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{o.type}</p>
                           <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">{o.id}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-lg font-black text-slate-900 leading-none">R$ {o.estimatedValue.toFixed(2)}</p>
                        <div className="mt-2">
                           <span className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${
                              o.status === RequestStatus.COMPLETED ? 'bg-blue-100 text-blue-600' : 
                              o.status === RequestStatus.AWAITING_APPROVAL ? 'bg-amber-100 text-amber-600' : 
                              o.status === RequestStatus.COLLECTOR_ASSIGNED ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                           }`}>
                             {o.status === RequestStatus.AWAITING_APPROVAL ? 'Coletor Interessado' : 
                              o.status === RequestStatus.COLLECTOR_ASSIGNED ? 'Em Rota' : o.status}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* BLOCO DE DECISÃO (Aparece quando o coletor aceita) */}
                  {o.status === RequestStatus.AWAITING_APPROVAL && (
                    <div className="bg-amber-50/50 p-8 rounded-[3rem] border border-amber-100 space-y-6 animate-slide-up shadow-inner">
                       <div className="flex flex-col items-center gap-4 text-center">
                          <div className="w-16 h-16 bg-white rounded-[1.8rem] flex items-center justify-center text-amber-500 shadow-sm relative">
                             <i className="fas fa-user-check text-2xl"></i>
                             <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Aprovação Necessária</p>
                             <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase">
                                <span className="font-black text-slate-900">{o.collectorName}</span> quer coletar sua sacola. Você concorda com a venda?
                             </p>
                          </div>
                       </div>
                       
                       <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => handleApproveCollector(o.id)}
                            disabled={loading}
                            className="w-full h-16 bg-amber-500 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-amber-200 active:scale-95 transition-all flex items-center justify-center gap-3"
                          >
                            {loading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-handshake"></i>}
                            Sim, Permitir Coleta
                          </button>
                          <button className="w-full h-10 text-[9px] font-black text-amber-600/50 uppercase tracking-widest hover:text-amber-600 transition-colors">Aguardar Outro Coletor</button>
                       </div>
                    </div>
                  )}

                  {o.status === RequestStatus.COLLECTOR_ASSIGNED && (
                    <div className="bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100 flex items-center gap-5">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
                          <i className="fas fa-truck-fast"></i>
                       </div>
                       <div className="flex-1">
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Logística Iniciada</p>
                          <p className="text-[11px] font-bold text-slate-600 uppercase">
                             {o.collectorName} está a caminho da sua residência.
                          </p>
                       </div>
                    </div>
                  )}
               </div>
             ))
           )}
        </div>
      </section>
    </div>
  );
};

export default ResidentDashboard;
