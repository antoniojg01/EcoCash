
import React, { useState, useEffect } from 'react';
import { User, PlasticDeclaration, RequestStatus, EcoMission } from '../types';
import { cloud } from '../services/cloudService';
import { findNearbyRecyclingPoints } from '../services/geminiService';

interface CollectorDashboardProps {
  user: User;
}

interface NearbyPoint {
  title: string;
  address: string;
  uri: string;
  hours: string;
  buyingPrice: number;
}

const CollectorDashboard: React.FC<CollectorDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'available' | 'ongoing' | 'energy'>('available');
  const [missions, setMissions] = useState<EcoMission[]>([]);
  const [offers, setOffers] = useState<PlasticDeclaration[]>([]);
  const [loadingOfferId, setLoadingOfferId] = useState<string | null>(null);
  const [nearbyPointsMap, setNearbyPointsMap] = useState<Record<string, NearbyPoint[]>>({});
  const [isLoadingPoints, setIsLoadingPoints] = useState<Record<string, boolean>>({});
  const [weightConfirmed, setWeightConfirmed] = useState<Record<string, boolean>>({});

  const fetchInitialData = async () => {
    const allOffers = await cloud.getOffers();
    setOffers(allOffers);
    setMissions(cloud.getMissions());
  };

  useEffect(() => {
    fetchInitialData();
    window.addEventListener('cloud_update', fetchInitialData);
    return () => window.removeEventListener('cloud_update', fetchInitialData);
  }, []);

  // Busca pontos próximos quando uma oferta é coletada ou visualizada
  const loadNearbyPoints = async (offer: PlasticDeclaration) => {
    if (nearbyPointsMap[offer.id] || isLoadingPoints[offer.id]) return;

    setIsLoadingPoints(prev => ({ ...prev, [offer.id]: true }));
    try {
      const result = await findNearbyRecyclingPoints(offer.location.lat, offer.location.lng);
      setNearbyPointsMap(prev => ({ ...prev, [offer.id]: result.points }));
    } catch (error) {
      console.error("Erro ao buscar pontos próximos:", error);
    } finally {
      setIsLoadingPoints(prev => ({ ...prev, [offer.id]: false }));
    }
  };

  useEffect(() => {
    const ongoing = offers.filter(o => o.collectorId === user.id && o.status === RequestStatus.COLLECTED);
    ongoing.forEach(offer => {
      loadNearbyPoints(offer);
    });
  }, [offers, user.id]);

  const handleConvertEnergy = () => {
    const amount = parseFloat(prompt('Quanto do seu saldo quer converter em créditos solar? (R$)') || '0');
    if (amount > 0 && amount <= user.balance) {
      const bonus = amount * 0.05;
      const total = amount + bonus;
      alert(`Conversão Realizada! R$ ${amount.toFixed(2)} + R$ ${bonus.toFixed(2)} bônus = R$ ${total.toFixed(2)} em créditos solar aplicados na sua próxima fatura.`);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    setLoadingOfferId(offerId);
    try {
      await cloud.acceptOffer(offerId, user.id);
      await fetchInitialData();
      setActiveTab('ongoing');
    } catch (e) {
      alert("Erro ao aceitar coleta");
    } finally {
      setLoadingOfferId(null);
    }
  };

  const handleMarkAsCollected = async (offerId: string) => {
    if (!weightConfirmed[offerId]) {
      alert("Por favor, confirme que o peso do material está correto primeiro.");
      return;
    }

    setLoadingOfferId(offerId);
    try {
      await cloud.markAsCollected(offerId);
      await fetchInitialData();
      alert("Carga marcada como coletada! Veja os melhores pontos de entrega abaixo.");
    } catch (e) {
      alert("Erro ao atualizar status");
    } finally {
      setLoadingOfferId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Endereço copiado para o GPS!");
  };

  const availableOffers = offers.filter(o => o.status === RequestStatus.PENDING);
  const myOngoingOffers = offers.filter(o => o.collectorId === user.id && 
    (o.status === RequestStatus.AWAITING_APPROVAL || o.status === RequestStatus.COLLECTOR_ASSIGNED || o.status === RequestStatus.COLLECTED));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* MENU DE NAVEGAÇÃO INTERNA */}
      <div className="flex bg-slate-100 p-1.5 rounded-full border border-slate-200">
        {(['available', 'ongoing', 'energy'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[9px] font-black rounded-full transition-all uppercase tracking-widest ${
              activeTab === tab ? 'bg-white shadow-md text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'available' ? 'Cargas' : tab === 'ongoing' ? 'Em Rota' : 'Eco-Energia'}
          </button>
        ))}
      </div>

      {activeTab === 'energy' && (
        <div className="space-y-8 animate-slide-up">
           <section className="bg-blue-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Logística Sustentável</p>
              <h3 className="text-3xl font-black mt-2">Poupe sua <br/>Conta de Luz</h3>
              <p className="text-[11px] font-bold text-blue-100 mt-4 leading-relaxed">
                Coletores registrados recebem 5% de bônus ao converter saldo de coletas em créditos de energia solar.
              </p>
              
              <div className="mt-10 bg-black/20 p-6 rounded-3xl border border-white/5 flex justify-between items-center">
                 <div>
                    <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest mb-1">Seu Saldo Conversível</p>
                    <p className="text-2xl font-black text-white">R$ {user.balance.toFixed(2)}</p>
                 </div>
                 <button 
                   onClick={handleConvertEnergy}
                   className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95"
                 >
                   Converter
                 </button>
              </div>
           </section>
        </div>
      )}

      {activeTab === 'available' && (
        <div className="space-y-4">
          {availableOffers.length === 0 ? (
            <div className="py-20 text-center opacity-30">
               <i className="fas fa-box-open text-4xl mb-4"></i>
               <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma carga disponível no momento</p>
            </div>
          ) : (
            availableOffers.map(o => (
              <div key={o.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 animate-slide-up">
                 <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Oferta #{o.id}</p>
                      <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{o.type}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-blue-600">R$ {(o.estimatedValue * 0.3).toFixed(2)}</p>
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Seu Ganho (30%)</p>
                    </div>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                    <i className="fas fa-location-dot text-blue-500"></i>
                    <p className="text-[10px] font-bold text-slate-500 truncate">{o.location.address}</p>
                 </div>
                 <button 
                   onClick={() => handleAcceptOffer(o.id)}
                   disabled={!!loadingOfferId}
                   className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50"
                 >
                   {loadingOfferId === o.id ? <i className="fas fa-circle-notch animate-spin"></i> : "Aceitar Coleta"}
                 </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'ongoing' && (
        <div className="space-y-6">
          {myOngoingOffers.length === 0 ? (
            <div className="py-20 text-center opacity-30">
               <i className="fas fa-truck-fast text-4xl mb-4"></i>
               <p className="text-[10px] font-black uppercase tracking-widest">Você não tem coletas em andamento</p>
            </div>
          ) : (
            myOngoingOffers.map(o => (
              <div key={o.id} className="bg-white p-8 rounded-[3.5rem] border-2 border-slate-100 shadow-2xl space-y-8 animate-slide-up relative overflow-hidden">
                 
                 {/* HEADER COM STATUS */}
                 <div className="flex items-center gap-2 pt-2 px-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${o.status === RequestStatus.COLLECTOR_ASSIGNED ? 'bg-emerald-500 animate-pulse' : o.status === RequestStatus.AWAITING_APPROVAL ? 'bg-amber-400' : 'bg-blue-500'}`}></span>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                      Status: {
                        o.status === RequestStatus.AWAITING_APPROVAL ? 'Aguardando Morador' : 
                        o.status === RequestStatus.COLLECTOR_ASSIGNED ? 'Em Rota de Coleta' : 'Coletado'
                      }
                    </p>
                 </div>

                 <div className="px-2">
                    <h4 className="text-3xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                       {o.estimatedWeight} KG de {o.type}
                    </h4>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 px-2">
                    <div className="bg-slate-50/80 p-6 rounded-[2.2rem] border border-slate-100/50">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Ganho Esperado</p>
                       <p className="text-2xl font-black text-emerald-600">R$ {(o.estimatedValue * 0.3).toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-50/80 p-6 rounded-[2.2rem] border border-slate-100/50">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Peso Est.</p>
                       <p className="text-2xl font-black text-slate-700">{o.estimatedWeight}kg</p>
                    </div>
                 </div>
                 
                 <div className="bg-slate-50/50 p-6 rounded-[2.2rem] flex items-center gap-4 border border-slate-100/50 mx-2">
                    <div className="w-10 h-10 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-sm">
                       <i className="fas fa-location-dot"></i>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 flex-1 truncate">{o.location.address}</p>
                 </div>

                 {o.status === RequestStatus.AWAITING_APPROVAL && (
                    <div className="bg-amber-50 p-6 rounded-3xl mx-2 text-center border border-amber-100">
                       <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                         O morador precisa aprovar sua venda para que você possa iniciar a rota.
                       </p>
                    </div>
                 )}

                 {o.status === RequestStatus.COLLECTOR_ASSIGNED && (
                    <div className="px-2 pb-2 space-y-6">
                       {/* CONFIRMAÇÃO DE PESO */}
                       <label className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl cursor-pointer active:bg-slate-100">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 accent-emerald-600"
                            checked={!!weightConfirmed[o.id]}
                            onChange={(e) => setWeightConfirmed({...weightConfirmed, [o.id]: e.target.checked})}
                          />
                          <span className="text-[10px] font-black text-slate-600 uppercase">Confirmo que o peso é {o.estimatedWeight}kg</span>
                       </label>

                       <button 
                         onClick={() => handleMarkAsCollected(o.id)}
                         disabled={!!loadingOfferId || !weightConfirmed[o.id]}
                         className={`w-full h-20 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.25em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 ${
                            weightConfirmed[o.id] ? 'bg-emerald-600' : 'bg-slate-300'
                         }`}
                       >
                         {loadingOfferId === o.id ? <i className="fas fa-circle-notch animate-spin text-xl"></i> : <i className="fas fa-check-double text-xl"></i>}
                         Confirmar Retirada
                       </button>
                    </div>
                 )}

                 {o.status === RequestStatus.COLLECTED && (
                    <div className="space-y-6">
                       <div className="px-4">
                          <h5 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                             <i className="fas fa-shop text-blue-500"></i> Melhores Pontos de Entrega
                          </h5>
                          
                          {isLoadingPoints[o.id] ? (
                            <div className="py-10 text-center">
                               <i className="fas fa-circle-notch animate-spin text-blue-200 text-2xl mb-2"></i>
                               <p className="text-[8px] font-black text-slate-300 uppercase">Buscando cotações via IA...</p>
                            </div>
                          ) : (
                             <div className="space-y-8 pb-4">
                                {(nearbyPointsMap[o.id] || []).map((point, pIdx) => (
                                   <div key={pIdx} className="bg-[#2563eb] p-8 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
                                      <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                                      
                                      <div className="relative z-10 flex flex-col items-center gap-5 text-center">
                                         <div className="w-14 h-14 bg-white/20 rounded-[1.8rem] flex items-center justify-center text-3xl backdrop-blur-md shadow-lg">
                                            <i className="fas fa-shop"></i>
                                         </div>
                                         
                                         <div className="space-y-1">
                                            <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.3em] opacity-80">Leve ao Ponto de Compra</p>
                                            <h6 className="text-2xl font-black tracking-tight uppercase leading-tight">{point.title}</h6>
                                         </div>

                                         <div className="bg-white/10 px-8 py-2.5 rounded-2xl border border-white/20 shadow-inner">
                                            <p className="text-base font-black tracking-[0.4em]">{o.id}</p>
                                         </div>

                                         <div className="space-y-3 w-full">
                                            <div onClick={() => copyToClipboard(point.address)} className="bg-black/10 p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-1 active:bg-black/20 transition-colors">
                                               <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Endereço Identificado via GPS</p>
                                               <p className="text-[11px] font-bold text-white/90 uppercase line-clamp-2">{point.address}</p>
                                               <i className="fas fa-copy text-[10px] mt-1 text-blue-200"></i>
                                            </div>

                                            <div className="flex items-center justify-center gap-2 text-blue-100/70">
                                               <i className="fas fa-clock text-[10px]"></i>
                                               <p className="text-[10px] font-bold uppercase tracking-widest">{point.hours}</p>
                                            </div>
                                         </div>
                                         
                                         <div className="bg-[#10b981] w-full py-4 rounded-[2rem] border border-emerald-400/30 flex items-center justify-center gap-3 shadow-lg mt-2">
                                            <i className="fas fa-arrow-trend-up text-white text-sm"></i>
                                            <span className="text-[12px] font-black uppercase tracking-[0.2em]">Preço: R$ {point.buyingPrice.toFixed(2)}/kg</span>
                                         </div>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          )}
                       </div>
                    </div>
                 )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CollectorDashboard;
