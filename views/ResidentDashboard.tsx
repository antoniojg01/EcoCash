
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
  const [showBagModal, setShowBagModal] = useState(false);
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

    setDraftItems(prev => [...prev, newItem]);
    setDescription('');
    setLoading(false);
  };

  const handleRemoveFromBag = (id: string) => {
    setDraftItems(prev => prev.filter(item => item.id !== id));
  };

  const handlePublishBatch = async () => {
    if (draftItems.length === 0) return;
    setLoading(true);

    const fullDescription = draftItems.map(i => i.description).join(', ');
    
    const newOffer: PlasticDeclaration = {
      id: `ECO-${Math.floor(1000 + Math.random() * 9000)}`,
      residentId: user.id,
      type: draftItems.length === 1 ? draftItems[0].description : `Lote: ${draftItems.length} itens`,
      quantity: draftItems.length,
      estimatedWeight: totalDraftWeight,
      estimatedValue: totalDraftValue,
      location: { address: 'Rua de Exemplo, 123', lat: -23.55, lng: -46.63 },
      status: RequestStatus.APPROVED, // Definindo como aprovado para simular o design da imagem
      isGuaranteed: true
    };

    cloud.createOffer(newOffer);
    setDraftItems([]);
    setLoading(false);
    setShowBagModal(false);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* CARD VENDER MATERIAL - IDENTICO À IMAGEM */}
      <section className="bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100/50 flex flex-col items-center text-center shadow-sm">
        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-50 flex items-center justify-center text-emerald-500 mb-6">
          <i className="fas fa-plus text-xl"></i>
        </div>
        <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Vender material</h3>
        <p className="text-[11px] text-slate-400 font-bold mt-1 mb-8">Anuncie agora e receba via EcoCloud.</p>
        
        <button 
          onClick={() => setShowBagModal(true)}
          className="w-full max-w-[240px] bg-[#474e5d] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
        >
          Novo Anúncio
        </button>

        {draftItems.length > 0 && (
          <div className="mt-6 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 animate-bounce">
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{draftItems.length} itens na sacola</span>
          </div>
        )}
      </section>

      {/* SEÇÃO OFERTAS ATIVAS */}
      <div className="space-y-6">
        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">Suas Ofertas Ativas</h4>
        
        <div className="space-y-4">
          {offers.map(o => (
            <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
                <i className="fas fa-check text-lg"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-black text-slate-800 text-[15px] truncate uppercase">{o.type}</h5>
                <div className="flex items-center gap-2 mt-1 opacity-40">
                  <span className="text-[10px] font-black uppercase tracking-widest">{o.id}</span>
                  <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{o.estimatedWeight.toFixed(0)}KG</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[15px] font-black text-slate-900 leading-none">R$ {o.estimatedValue.toFixed(2)}</p>
                <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mt-2">{o.status}</p>
              </div>
            </div>
          ))}

          {offers.length === 0 && (
            <div className="py-12 text-center opacity-10">
              <i className="fas fa-box-open text-3xl mb-3"></i>
              <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma oferta ativa</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE SACOLA / LISTA */}
      {showBagModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-end animate-fade-in">
          <div className="bg-white w-full max-h-[92vh] rounded-t-[3.5rem] p-8 animate-slide-up pb-12 overflow-hidden flex flex-col shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 shrink-0"></div>
            
            <div className="flex justify-between items-center mb-8 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sua Sacola</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Crie uma lista antes de vender</p>
              </div>
              <button onClick={() => setShowBagModal(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* INPUT DE ADIÇÃO RÁPIDA */}
            <div className="flex gap-3 mb-8 shrink-0">
              <input 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: 5 garrafas PET..."
                className="flex-1 bg-slate-50 border border-slate-100 p-5 rounded-[1.8rem] font-bold text-sm outline-none focus:border-emerald-500 transition-all"
              />
              <button 
                disabled={loading || !description.trim()}
                onClick={handleAddItemToBag}
                className="w-16 h-16 bg-slate-900 text-white rounded-[1.8rem] flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-20"
              >
                {loading ? <i className="fas fa-sync-alt animate-spin"></i> : <i className="fas fa-plus"></i>}
              </button>
            </div>

            {/* LISTA DE ITENS NA SACOLA */}
            <div className="flex-1 overflow-y-auto space-y-4 hide-scrollbar">
              {draftItems.map(item => (
                <div key={item.id} className="bg-slate-50/50 p-5 rounded-[2rem] border border-slate-100 flex items-center gap-4 animate-fade-in">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                    <i className="fas fa-cube text-xs"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate">{item.description}</p>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">R$ {item.value.toFixed(2)}</p>
                  </div>
                  <button onClick={() => handleRemoveFromBag(item.id)} className="w-10 h-10 text-slate-300 hover:text-red-500 transition-all">
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              ))}
              {draftItems.length === 0 && (
                <div className="py-20 text-center opacity-30">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Insira itens acima</p>
                </div>
              )}
            </div>

            {/* RESUMO E PUBLICAÇÃO */}
            {draftItems.length > 0 && (
              <div className="mt-8 pt-8 border-t border-slate-50 space-y-6 shrink-0">
                <div className="flex justify-between items-center px-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total Estimado</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{totalDraftWeight.toFixed(1)}kg</p>
                  </div>
                  <p className="text-3xl font-black text-emerald-600">R$ {totalDraftValue.toFixed(2)}</p>
                </div>
                <button 
                  onClick={handlePublishBatch}
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl shadow-emerald-100 active:scale-95 transition-all"
                >
                  Finalizar e Anunciar
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
