
import React, { useState, useEffect } from 'react';
import { User, RequestStatus, PlasticDeclaration } from '../types';
import { cloud } from '../services/cloudService';
import { estimateWeightAndValue } from '../services/geminiService';

interface ResidentDashboardProps {
  user: User;
}

interface DraftItem {
  id: string;
  description: string;
  weight: number;
  value: number;
}

const ResidentDashboard: React.FC<ResidentDashboardProps> = ({ user }) => {
  const [showDeclare, setShowDeclare] = useState(false);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [offers, setOffers] = useState<PlasticDeclaration[]>([]);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);

  useEffect(() => {
    const handleSync = () => setOffers(cloud.getOffers().filter(o => o.residentId === user.id));
    handleSync();
    window.addEventListener('cloud_update', handleSync);
    return () => window.removeEventListener('cloud_update', handleSync);
  }, [user.id]);

  const totalDraftValue = draftItems.reduce((acc, item) => acc + item.value, 0);
  const totalDraftWeight = draftItems.reduce((acc, item) => acc + item.weight, 0);

  const handleAddItemToBag = async () => {
    if (!description.trim()) return;
    setLoading(true);
    
    // IA estima o peso e valor individual do item
    const estimate = await estimateWeightAndValue(description, "Mix de Plásticos");
    
    const newItem: DraftItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: description,
      weight: estimate.estimatedWeight,
      value: estimate.estimatedWeight * 2.5 // Base de cálculo R$ 2.50/kg
    };

    setDraftItems([...draftItems, newItem]);
    setDescription('');
    setLoading(false);
  };

  const handleRemoveFromBag = (id: string) => {
    setDraftItems(draftItems.filter(item => item.id !== id));
  };

  const handlePublishBatch = async () => {
    if (draftItems.length === 0) return;
    setLoading(true);

    const fullDescription = draftItems.map(i => i.description).join(', ');
    
    const newOffer: PlasticDeclaration = {
      id: `ECO-${Math.floor(1000 + Math.random() * 9000)}`,
      residentId: user.id,
      type: `Lote: ${draftItems.length} itens`,
      quantity: draftItems.length,
      estimatedWeight: totalDraftWeight,
      estimatedValue: totalDraftValue,
      location: { address: 'Rua de Exemplo, 123', lat: -23, lng: -46 },
      status: RequestStatus.PENDING,
      isGuaranteed: true
    };

    cloud.createOffer(newOffer);
    setDraftItems([]);
    setLoading(false);
    setShowDeclare(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* SEÇÃO DE VENDA / SACOLA ATIVA */}
      <section className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white text-emerald-600 rounded-[1.8rem] flex items-center justify-center text-2xl shadow-sm border border-slate-100 shrink-0">
            <i className="fas fa-shopping-basket"></i>
          </div>
          <div className="flex-1">
            <h3 className="font-black text-slate-800 text-lg leading-tight">Sacola de Recicláveis</h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {draftItems.length} Itens Acumulados
            </p>
          </div>
          <div className="text-right">
             <p className="text-xl font-black text-emerald-600 leading-none">R$ {totalDraftValue.toFixed(2)}</p>
             <p className="text-[9px] font-black text-slate-300 uppercase mt-1">{totalDraftWeight.toFixed(1)}kg total</p>
          </div>
        </div>

        <button 
          onClick={() => setShowDeclare(true)} 
          className="w-full bg-[#334155] text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-3"
        >
          <i className="fas fa-plus"></i>
          Adicionar Itens
        </button>

        {draftItems.length > 0 && (
          <button 
            onClick={handlePublishBatch}
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 animate-slide-up"
          >
            {loading ? <i className="fas fa-sync-alt animate-spin"></i> : <i className="fas fa-bullhorn"></i>}
            Publicar Venda Agora
          </button>
        )}
      </section>

      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 pt-4">Histórico de Ofertas</h4>

      <div className="space-y-4 pb-8">
        {offers.map(o => (
          <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg ${
              o.status === RequestStatus.PENDING 
                ? 'bg-amber-50 text-amber-500' 
                : 'bg-emerald-50 text-emerald-600'
            }`}>
              <i className={`fas ${o.status === RequestStatus.PENDING ? 'fa-clock' : 'fa-check-circle'}`}></i>
            </div>
            <div className="flex-1 overflow-hidden">
              <h5 className="font-black text-slate-800 text-[15px] leading-tight truncate">{o.type}</h5>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{o.id}</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{o.estimatedWeight}KG</span>
              </div>
            </div>
            <div className="text-right">
               <p className="text-sm font-black text-slate-900 leading-none">R$ {o.estimatedValue.toFixed(2)}</p>
               <p className={`text-[8px] font-black uppercase tracking-widest mt-2 ${
                 o.status === RequestStatus.PENDING ? 'text-amber-500' : 'text-orange-400'
               }`}>{o.status}</p>
            </div>
          </div>
        ))}
        {offers.length === 0 && (
          <div className="py-20 text-center opacity-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <i className="fas fa-box-open text-3xl"></i>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest">Aguardando sua primeira venda</p>
          </div>
        )}
      </div>

      {/* MODAL DE GERENCIAMENTO DA SACOLA */}
      {showDeclare && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end animate-fade-in">
          <div className="bg-white w-full max-h-[90vh] rounded-t-[3.5rem] p-8 animate-slide-up pb-12 overflow-y-auto flex flex-col shadow-2xl">
            <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 shrink-0"></div>
            
            <div className="flex justify-between items-center mb-10 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">O que você tem?</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Adicione itens à sua sacola</p>
              </div>
              <button onClick={() => setShowDeclare(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* INPUT DE ADIÇÃO */}
            <div className="space-y-4 mb-10 shrink-0">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 focus-within:border-emerald-500 transition-all">
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: 5 garrafas PET transparentes..." 
                  className="w-full bg-transparent h-20 outline-none font-bold text-sm text-slate-900 resize-none placeholder:text-slate-300"
                />
              </div>
              <button 
                disabled={loading || !description.trim()}
                onClick={handleAddItemToBag}
                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-20"
              >
                {loading ? <i className="fas fa-sync-alt animate-spin"></i> : <i className="fas fa-plus"></i>}
                Adicionar à Sacola
              </button>
            </div>

            {/* LISTA DE ITENS NA SACOLA */}
            <div className="flex-1 space-y-4">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Itens na Sacola ({draftItems.length})</h4>
              {draftItems.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-50 shadow-sm flex items-center gap-4 animate-fade-in group">
                  <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center text-xs">
                    <i className="fas fa-cube"></i>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-black text-slate-800 truncate">{item.description}</p>
                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">~ {item.weight.toFixed(1)}kg • R$ {item.value.toFixed(2)}</p>
                  </div>
                  <button onClick={() => handleRemoveFromBag(item.id)} className="w-10 h-10 bg-red-50 text-red-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90">
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              ))}
              {draftItems.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-slate-50 rounded-[2rem]">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Sua sacola está vazia</p>
                </div>
              )}
            </div>

            {/* RESUMO E PUBLICAÇÃO */}
            {draftItems.length > 0 && (
              <div className="mt-10 pt-8 border-t border-slate-50 space-y-6 shrink-0">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Acumulado</p>
                  <p className="text-2xl font-black text-emerald-600">R$ {totalDraftValue.toFixed(2)}</p>
                </div>
                <button 
                  onClick={handlePublishBatch}
                  className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-emerald-100 active:scale-95 transition-all"
                >
                  Confirmar e Publicar Anúncio
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentDashboard;
