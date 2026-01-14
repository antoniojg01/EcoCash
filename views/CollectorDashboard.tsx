
import React, { useState, useEffect, useMemo } from 'react';
import { User, PlasticDeclaration, RequestStatus } from '../types';
import { cloud } from '../services/cloudService';
import { findNearbyRecyclingPoints } from '../services/geminiService';

interface CollectorDashboardProps {
  user: User;
}

interface VehicleConfig {
  type: 'moto' | 'carro' | 'bicicleta' | 'pe';
  consumption: number; 
  radius: number; 
  fuelPrice: number;
}

const CollectorDashboard: React.FC<CollectorDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'available' | 'ongoing' | 'destinations'>('available');
  const [offers, setOffers] = useState<PlasticDeclaration[]>([]);
  const [confirmedWeight, setConfirmedWeight] = useState<string>('');
  const [activeReceipt, setActiveReceipt] = useState<PlasticDeclaration | null>(null);
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(false);
  const [destinationInfo, setDestinationInfo] = useState<{text: string, points: any[]}>({text: '', points: []});
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  
  const [vehicle, setVehicle] = useState<VehicleConfig>(() => {
    const saved = localStorage.getItem('collector_vehicle_v2');
    return saved ? JSON.parse(saved) : { 
      type: 'moto', 
      consumption: 35, 
      radius: 10,
      fuelPrice: 6.15
    };
  });

  useEffect(() => {
    const handleSettingsUpdate = () => {
      const saved = localStorage.getItem('collector_vehicle_v2');
      if (saved) setVehicle(JSON.parse(saved));
    };
    window.addEventListener('vehicle_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('vehicle_settings_updated', handleSettingsUpdate);
  }, []);

  useEffect(() => {
    setOffers(cloud.getOffers());
    const handleSync = () => setOffers(cloud.getOffers());
    window.addEventListener('cloud_update', handleSync);
    return () => window.removeEventListener('cloud_update', handleSync);
  }, []);

  const calculateFinancials = (grossValue: number, distance: number) => {
    if (vehicle.type === 'bicicleta' || vehicle.type === 'pe') {
      return { cost: 0, net: grossValue };
    }
    const fuelNeeded = (distance * 2) / (vehicle.consumption || 1);
    const cost = fuelNeeded * vehicle.fuelPrice;
    const net = grossValue - cost;
    return { cost, net };
  };

  const offersWithDistance = useMemo(() => {
    return offers.map((o) => ({
      ...o,
      distanceKm: 2.5,
      estimatedWeight: o.estimatedWeight || 8
    }));
  }, [offers]);

  const handleFetchDestinations = async () => {
    setIsLoadingDestinations(true);
    
    let lat = -23.5615;
    let lng = -46.6559;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      });
    }

    const result = await findNearbyRecyclingPoints(lat, lng);
    setDestinationInfo(result);
    setIsLoadingDestinations(false);
  };

  useEffect(() => {
    if (activeTab === 'destinations') {
      handleFetchDestinations();
    }
  }, [activeTab]);

  const handleAccept = (id: string) => {
    cloud.updateOffer(id, { 
      status: RequestStatus.COLLECTOR_ASSIGNED, 
      collectorId: user.id 
    });
    setActiveTab('ongoing');
  };

  const handleConfirmCollection = async (offer: PlasticDeclaration) => {
    const weight = parseFloat(confirmedWeight);
    if (isNaN(weight) || weight <= 0) return;
    
    const updatedOffer = {
      ...offer,
      status: RequestStatus.COLLECTED,
      actualWeight: weight,
      timestamp: Date.now(),
      estimatedValue: (offer.estimatedValue / offer.estimatedWeight) * weight
    };
    
    cloud.updateOffer(offer.id, updatedOffer);
    setActiveReceipt(updatedOffer);
    setConfirmedWeight('');
  };

  const handleShareReceipt = () => {
    if (!activeReceipt) return;
    const text = `EcoCash - Recibo de Coleta\nID: ${activeReceipt.id}\nMaterial: ${activeReceipt.type}\nPeso: ${activeReceipt.actualWeight}kg\nValor Líquido: R$ ${activeReceipt.estimatedValue.toFixed(2)}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Meu Recibo EcoCash',
        text: text,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert('Recibo copiado para a área de transferência!');
    }
  };

  const availableOffers = offersWithDistance.filter(o => 
    (o.status === RequestStatus.PENDING || o.status === RequestStatus.APPROVED) &&
    o.distanceKm <= vehicle.radius
  );

  const myOngoing = offersWithDistance.filter(o => o.collectorId === user.id && o.status !== RequestStatus.COMPLETED);
  const totalCurrentWeight = myOngoing.filter(o => o.status === RequestStatus.COLLECTED).reduce((acc, o) => acc + (o.actualWeight || 0), 0);

  const destinationsWithLucro = useMemo(() => {
    if (!destinationInfo.points.length) return [];
    return destinationInfo.points.map((p, idx) => {
      const dist = (idx + 1) * 1.5; 
      const revenue = totalCurrentWeight * p.buyingPrice;
      const { cost, net } = calculateFinancials(revenue, dist);
      return { ...p, dist, revenue, cost, net };
    }).sort((a, b) => b.net - a.net);
  }, [destinationInfo.points, totalCurrentWeight, vehicle]);

  return (
    <div className="space-y-10 animate-fade-in">
      {/* TABS MENU */}
      <div className="flex bg-[#F8FAFC] p-2 rounded-full shadow-sm">
        {(['available', 'ongoing', 'destinations'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-[9px] font-black rounded-full transition-all uppercase tracking-[0.15em] ${
              activeTab === tab ? 'bg-white shadow-md text-blue-500' : 'text-slate-300 hover:text-slate-400'
            }`}
          >
            {tab === 'available' ? 'Mercado' : tab === 'ongoing' ? 'Em Rota' : 'Onde Vender'}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'available' && (
          <div className="space-y-8">
            <div className="px-2 flex justify-between items-center">
               <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Ofertas no seu Raio</h3>
               <span className="bg-slate-100 px-3 py-1 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest">{availableOffers.length} Disponíveis</span>
            </div>
            
            {availableOffers.length === 0 && (
              <div className="py-24 text-center opacity-20">
                <i className="fas fa-satellite-dish text-5xl mb-6"></i>
                <p className="text-[11px] font-black uppercase tracking-widest">Aguardando novas ofertas...</p>
              </div>
            )}

            {availableOffers.map(o => {
              const { cost, net } = calculateFinancials(o.estimatedValue, o.distanceKm);
              return (
                <div key={o.id} className="bg-white p-10 rounded-[3rem] shadow-[0_15px_40px_rgba(0,0,0,0.03)] space-y-8 border border-slate-50 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      {o.isGuaranteed && (
                        <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest mb-4">
                          <i className="fas fa-check-circle"></i> Pagamento Garantido
                        </div>
                      )}
                      <h4 className="text-3xl font-black text-slate-800 tracking-tight">{o.type}</h4>
                      <div className="flex items-center gap-3 mt-3">
                         <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                            <i className="fas fa-location-dot"></i> {o.distanceKm}KM
                         </span>
                         <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                         <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{o.estimatedWeight}KG</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-black leading-none ${net > 0 ? 'text-emerald-500' : 'text-red-400'}`}>R$ {net.toFixed(2)}</p>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2">Lucro Líquido</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-50">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Venda Bruta</p>
                      <p className="text-[13px] font-bold text-slate-500">R$ {o.estimatedValue.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-50">
                      <p className="text-[9px] font-black text-red-200 uppercase tracking-widest mb-2">Custo Combustível</p>
                      <p className="text-[13px] font-bold text-red-400">R$ {cost.toFixed(2)}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleAccept(o.id)} 
                    className="w-full bg-[#5d646b] text-white h-20 rounded-full font-black text-[12px] uppercase tracking-[0.25em] shadow-lg active:scale-95 transition-all"
                  >
                    Aceitar esta Coleta
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'ongoing' && (
          <div className="space-y-8">
            {myOngoing.length === 0 && (
              <div className="py-24 text-center opacity-20">
                <i className="fas fa-route text-5xl mb-6"></i>
                <p className="text-[11px] font-black uppercase tracking-widest">Nenhuma coleta ativa</p>
              </div>
            )}
            {myOngoing.map(o => (
              <div key={o.id} className={`p-10 rounded-[3rem] shadow-sm border space-y-6 transition-all ${o.status === RequestStatus.COLLECTED ? 'bg-emerald-50/30 border-emerald-100 shadow-emerald-500/5' : 'bg-white border-slate-50'}`}>
                <div className="flex justify-between items-center">
                   <h4 className={`text-2xl font-black tracking-tight uppercase ${o.status === RequestStatus.COLLECTED ? 'text-emerald-700' : 'text-slate-800'}`}>{o.type}</h4>
                   <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{o.id}</span>
                </div>
                <p className="text-sm font-bold text-slate-400 italic"><i className="fas fa-location-dot mr-2 text-emerald-500"></i>{o.location.address}</p>
                
                {o.status !== RequestStatus.COLLECTED && (
                  <div className="space-y-5 pt-4">
                    <input 
                      type="number" 
                      value={confirmedWeight}
                      onChange={(e) => setConfirmedWeight(e.target.value)}
                      placeholder="Peso real na balança (KG)"
                      className="w-full bg-slate-50 p-6 rounded-3xl font-black text-sm outline-none border border-transparent focus:border-blue-200"
                    />
                    <button 
                      onClick={() => handleConfirmCollection(o)}
                      className="w-full bg-emerald-600 text-white h-20 rounded-full font-black text-[12px] uppercase tracking-widest shadow-xl"
                    >Finalizar Coleta</button>
                  </div>
                )}

                {o.status === RequestStatus.COLLECTED && (
                   <div className="space-y-5 pt-2 animate-slide-up">
                      <div className="bg-emerald-500/10 p-6 rounded-3xl flex items-center justify-center gap-4 border border-emerald-500/20">
                         <i className="fas fa-check-double text-emerald-500 text-2xl shadow-sm"></i>
                         <div className="text-left">
                            <span className="text-sm font-black text-emerald-700 uppercase tracking-widest block leading-none mb-1">Coleta Concluída</span>
                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.1em]">Recibo pronto p/ compartilhar</span>
                         </div>
                      </div>
                      <button 
                        onClick={() => setActiveReceipt(o)}
                        className="w-full bg-emerald-600 text-white h-16 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
                      >
                        <i className="fas fa-receipt"></i>
                        Ver Recibo Digital
                      </button>
                   </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'destinations' && (
          <div className="animate-slide-up space-y-8">
            <div className="bg-[#f1f5f9] p-8 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-2xl font-black text-slate-700 tracking-tight">Onde Vender</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Carga:</span>
                  <span className="text-[11px] font-black text-blue-500">{totalCurrentWeight.toFixed(1)}kg</span>
                </div>
              </div>
              
              {isLoadingDestinations ? (
                <div className="py-24 text-center space-y-6">
                  <i className="fas fa-spinner animate-spin text-4xl text-blue-400"></i>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Otimizando rotas de lucro...</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {destinationsWithLucro.length === 0 && (
                    <div className="bg-white p-10 rounded-[2.5rem] text-center opacity-40">
                      <p className="text-[10px] font-black uppercase tracking-widest">Colete materiais para ver projeção de lucro</p>
                    </div>
                  )}
                  {destinationsWithLucro.map((p, idx) => (
                    <div key={idx} className={`bg-white p-8 rounded-[2.5rem] shadow-[0_5px_20px_rgba(0,0,0,0.02)] flex flex-col gap-6 relative overflow-hidden transition-all hover:shadow-xl ${idx === 0 ? 'border-2 border-emerald-500/20' : 'border border-slate-50'}`}>
                      {idx === 0 && (
                        <div className="absolute top-0 right-0 bg-emerald-500 text-white px-6 py-2 rounded-bl-3xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg">
                          Melhor Lucro
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 pr-4">
                           <h5 className="font-black text-slate-700 text-base mb-1 truncate">{p.title}</h5>
                           <div className="flex items-center gap-2">
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                {p.dist}KM <span className="mx-1 opacity-20">•</span> R$ {p.buyingPrice.toFixed(2)}/KG
                              </p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className={`text-xl font-black ${p.net > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                             R$ {p.net.toFixed(2)}
                           </p>
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Lucro Projetado</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex gap-4">
                          <div className="text-left">
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Venda</p>
                            <p className="text-[11px] font-bold text-slate-500">R$ {p.revenue.toFixed(2)}</p>
                          </div>
                          <div className="text-left">
                            <p className="text-[8px] font-black text-red-200 uppercase tracking-widest">Custo</p>
                            <p className="text-[11px] font-bold text-red-300">R$ {p.cost.toFixed(2)}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedDestination(p)}
                          className="bg-slate-50 text-slate-400 px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all"
                        >
                          Ver Rota
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-6">
                    <button 
                      onClick={handleFetchDestinations} 
                      className="w-full h-16 rounded-full border-2 border-dashed border-blue-200 text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] bg-white/50 hover:bg-white transition-all"
                    >
                      Atualizar Locais Próximos
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE ROTA / ENDEREÇO */}
      {selectedDestination && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[300] flex items-end justify-center p-6 animate-fade-in" onClick={() => setSelectedDestination(null)}>
          <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 pb-12 animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-8"></div>
            
            <div className="flex items-start gap-5 mb-8">
               <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center shrink-0">
                  <i className="fas fa-map-location-dot text-2xl"></i>
               </div>
               <div>
                  <h4 className="text-xl font-black text-slate-800 leading-tight mb-1">{selectedDestination.title}</h4>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Ponto de Venda Autorizado</p>
               </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-8">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Endereço de Destino</p>
               <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                 {selectedDestination.address}
               </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="text-center">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Distância</p>
                  <p className="text-base font-black text-slate-700">{selectedDestination.dist.toFixed(1)} km</p>
               </div>
               <div className="text-center">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Pagamento</p>
                  <p className="text-base font-black text-emerald-500">R$ {selectedDestination.buyingPrice.toFixed(2)}/kg</p>
               </div>
            </div>

            <div className="flex flex-col gap-3">
               <a 
                 href={selectedDestination.uri !== '#' ? selectedDestination.uri : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedDestination.title + ' ' + selectedDestination.address)}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="w-full bg-[#059669] text-white h-16 rounded-full flex items-center justify-center font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
               >
                 Abrir no Google Maps
               </a>
               <button 
                 onClick={() => setSelectedDestination(null)}
                 className="w-full h-16 rounded-full text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
               >
                 Voltar
               </button>
            </div>
          </div>
        </div>
      )}

      {/* RECIBO DIGITAL DETALHADO */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[400] flex items-center justify-center p-8 animate-fade-in" onClick={() => setActiveReceipt(null)}>
          <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden animate-slide-up shadow-2xl relative flex flex-col" onClick={e => e.stopPropagation()}>
            
            {/* TOPO DO RECIBO */}
            <div className="bg-emerald-600 p-8 text-center text-white relative">
               <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-receipt text-2xl"></i>
               </div>
               <h3 className="text-xl font-black uppercase tracking-widest">Recibo de Coleta</h3>
               <p className="text-[9px] font-bold opacity-60 uppercase mt-1 tracking-[0.2em]">Autenticado pela Rede EcoCash</p>
               
               {/* Decoração serrilhada simulada */}
               <div className="absolute -bottom-2 left-0 right-0 h-4 flex gap-1 px-1">
                  {Array.from({length: 20}).map((_, i) => (
                    <div key={i} className="flex-1 bg-white h-full rounded-t-full"></div>
                  ))}
               </div>
            </div>

            {/* CORPO DO RECIBO */}
            <div className="p-10 space-y-8 bg-white pt-12">
               <div className="flex justify-between items-start border-b border-slate-50 pb-6">
                  <div>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">ID da Transação</p>
                    <p className="text-sm font-black text-slate-800 tracking-wider">{activeReceipt.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Data/Hora</p>
                    <p className="text-[10px] font-bold text-slate-500">
                      {new Date(activeReceipt.timestamp || Date.now()).toLocaleDateString()} — {new Date(activeReceipt.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material</span>
                    <span className="text-sm font-black text-slate-700 uppercase">{activeReceipt.type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peso Confirmado</span>
                    <span className="text-sm font-black text-blue-600">{activeReceipt.actualWeight} KG</span>
                  </div>
               </div>

               {/* FINANCEIRO DO RECIBO */}
               <div className="bg-slate-50 p-6 rounded-3xl space-y-3 border border-slate-100">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>Valor Bruto Estimado</span>
                    <span>R$ {activeReceipt.estimatedValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-red-300">
                    <span>Logística (Combustível)</span>
                    <span>- R$ {(calculateFinancials(activeReceipt.estimatedValue, 2.5).cost).toFixed(2)}</span>
                  </div>
                  <div className="h-[1px] bg-slate-200 w-full my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Lucro Líquido</span>
                    <span className="text-xl font-black text-emerald-600">R$ {calculateFinancials(activeReceipt.estimatedValue, 2.5).net.toFixed(2)}</span>
                  </div>
               </div>

               <div className="flex flex-col gap-3 pt-4">
                  <button 
                    onClick={handleShareReceipt}
                    className="w-full bg-slate-900 text-white h-16 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95"
                  >
                    <i className="fas fa-share-nodes"></i>
                    Compartilhar Recibo
                  </button>
                  <button 
                    onClick={() => setActiveReceipt(null)}
                    className="w-full h-14 text-slate-400 font-black text-[9px] uppercase tracking-widest hover:text-slate-600"
                  >
                    Fechar Comprovante
                  </button>
               </div>
            </div>

            {/* RODAPÉ DO RECIBO */}
            <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
               <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.3em]">
                 EcoCash • Documento Digital • Rastreabilidade Garantida
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorDashboard;
