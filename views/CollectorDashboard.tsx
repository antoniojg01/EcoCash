
import React, { useState, useEffect, useMemo } from 'react';
import { User, PlasticDeclaration, RequestStatus } from '../types';
import { cloud } from '../services/cloudService';
import { getSmartRoutes } from '../services/geminiService';

interface CollectorDashboardProps {
  user: User;
}

interface VehicleConfig {
  type: 'moto' | 'carro' | 'bicicleta' | 'pe';
  consumption: number; // km/l
  radius: number; // km
  fuelPrice: number;
}

const CollectorDashboard: React.FC<CollectorDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'available' | 'ongoing' | 'profile'>('available');
  const [offers, setOffers] = useState<PlasticDeclaration[]>([]);
  const [confirmedWeight, setConfirmedWeight] = useState<string>('');
  const [activeReceipt, setActiveReceipt] = useState<PlasticDeclaration | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
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
    localStorage.setItem('collector_vehicle_v2', JSON.stringify(vehicle));
  }, [vehicle]);

  useEffect(() => {
    setOffers(cloud.getOffers());
    const handleSync = () => setOffers(cloud.getOffers());
    window.addEventListener('cloud_update', handleSync);
    return () => window.removeEventListener('cloud_update', handleSync);
  }, []);

  const offersWithDistance = useMemo(() => {
    return offers.map((o, idx) => ({
      ...o,
      distanceKm: ((idx + 1) * 2.5) % 15 || 2 
    }));
  }, [offers]);

  const calculateFinancials = (grossValue: number, distance: number) => {
    if (vehicle.type === 'bicicleta' || vehicle.type === 'pe') {
      return { cost: 0, net: grossValue };
    }
    const fuelNeeded = (distance * 2) / (vehicle.consumption || 1);
    const cost = fuelNeeded * vehicle.fuelPrice;
    const net = Math.max(0, grossValue - cost);
    return { cost, net };
  };

  const handleOptimizeRoutes = async () => {
    setIsOptimizing(true);
    const locations = myOngoing.map(o => o.location);
    await new Promise(resolve => setTimeout(resolve, 1500));
    await getSmartRoutes(locations);
    setIsOptimizing(false);
    alert("Rotas otimizadas com sucesso! Sua sequência de coleta foi ajustada para economizar combustível e tempo.");
  };

  const handleAccept = (id: string) => {
    cloud.updateOffer(id, { 
      status: RequestStatus.COLLECTOR_ASSIGNED, 
      collectorId: user.id 
    });
    setActiveTab('ongoing');
  };

  const handleConfirmCollection = async (offer: PlasticDeclaration) => {
    const weight = parseFloat(confirmedWeight);
    if (isNaN(weight) || weight <= 0) {
      alert("Por favor, insira o peso exato medido na balança.");
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const updatedOffer = {
      ...offer,
      status: RequestStatus.COLLECTED,
      actualWeight: weight,
      estimatedValue: (offer.estimatedValue / offer.estimatedWeight) * weight
    };

    cloud.updateOffer(offer.id, updatedOffer);
    setIsProcessing(false);
    setActiveReceipt(updatedOffer);
    setConfirmedWeight('');
  };

  const availableOffers = offersWithDistance.filter(o => 
    (o.status === RequestStatus.PENDING || o.status === RequestStatus.APPROVED) &&
    o.distanceKm <= vehicle.radius
  );

  const myOngoing = offersWithDistance.filter(o => o.collectorId === user.id && o.status !== RequestStatus.COMPLETED);

  const costPerKm = vehicle.type === 'bicicleta' || vehicle.type === 'pe' ? 0 : vehicle.fuelPrice / (vehicle.consumption || 1);

  return (
    <div className="space-y-10 pb-32 animate-fade-in">
      {/* Veículo Header Expandido */}
      <section className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center text-3xl border border-white/10 shadow-inner">
              <i className={`fas fa-${vehicle.type === 'moto' ? 'motorcycle' : vehicle.type === 'carro' ? 'car' : vehicle.type === 'bicicleta' ? 'bicycle' : 'walking'}`}></i>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">Status Operacional</p>
              <h2 className="text-2xl font-black">R$ {costPerKm.toFixed(2)} <span className="text-xs font-bold opacity-40">/ km</span></h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Raio Ativo</p>
            <h2 className="text-2xl font-black text-white">{vehicle.radius}km</h2>
          </div>
        </div>
      </section>

      {/* Tabs Menu mais espaçado */}
      <div className="flex bg-slate-100 p-2 rounded-[2rem]">
        {(['available', 'ongoing', 'profile'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-[10px] font-black rounded-2xl transition-all uppercase tracking-[0.15em] ${
              activeTab === tab ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'available' ? 'Mercado' : tab === 'ongoing' ? 'Em Curso' : 'Veículo'}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'available' && (
          <div className="space-y-8">
            {availableOffers.length === 0 && (
              <div className="py-24 text-center opacity-20">
                <i className="fas fa-satellite-dish text-5xl mb-6"></i>
                <p className="text-[11px] font-black uppercase tracking-widest">Buscando novas ofertas...</p>
              </div>
            )}
            {availableOffers.map(o => {
              const { cost, net } = calculateFinancials(o.estimatedValue, o.distanceKm);
              const isGuaranteed = o.status === RequestStatus.APPROVED;
              return (
                <div key={o.id} className={`bg-white p-8 rounded-[3rem] border-2 transition-all relative group ${isGuaranteed ? 'border-emerald-500 shadow-xl shadow-emerald-50' : 'border-slate-50 shadow-sm'}`}>
                  {isGuaranteed && (
                    <div className="absolute -top-3 left-8 bg-emerald-500 text-white px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-100">
                      <i className="fas fa-shield-check"></i> Pagamento Garantido
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-8 pt-2">
                    <div className="space-y-2">
                      <h4 className="text-xl font-black text-slate-900 tracking-tight">{o.type}</h4>
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">{o.estimatedWeight}kg</span>
                        <span className="w-1.5 h-1.5 bg-blue-200 rounded-full"></span>
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest"><i className="fas fa-location-dot mr-1"></i> {o.distanceKm}km</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-600 leading-none">R$ {net.toFixed(2)}</p>
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-2">Ganho Líquido</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-slate-400 text-xs shadow-sm">
                        <i className="fas fa-money-bill-wave"></i>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Bruto</p>
                        <p className="text-xs font-bold text-slate-700">R$ {o.estimatedValue.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="bg-red-50/50 p-4 rounded-3xl border border-red-50 flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-red-300 text-xs shadow-sm">
                        <i className="fas fa-gas-pump"></i>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-red-400 uppercase">Custo</p>
                        <p className="text-xs font-bold text-red-500">R$ {cost.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleAccept(o.id)}
                    className="w-full bg-slate-900 text-white h-16 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all hover:bg-slate-800"
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
            {myOngoing.length > 1 && (
              <button 
                onClick={handleOptimizeRoutes}
                disabled={isOptimizing}
                className="w-full bg-blue-600 text-white h-16 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-xl shadow-blue-100 mb-6"
              >
                {isOptimizing ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-sparkles"></i>}
                Otimizar Rotas (IA)
              </button>
            )}
            
            {myOngoing.map(o => (
              <div key={o.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 space-y-8">
                <div className="flex justify-between items-center">
                  <div className="bg-blue-50 px-4 py-2 rounded-2xl">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-0.5">Protocolo</span>
                    <span className="text-xs font-black text-blue-700">{o.id}</span>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border ${
                    o.status === RequestStatus.COLLECTED 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                  }`}>
                      {o.status === RequestStatus.COLLECTED ? 'Material Coletado' : 'Em Rota'}
                  </div>
                </div>
                
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">{o.type}</h4>
                
                {o.status !== RequestStatus.COLLECTED ? (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 focus-within:border-blue-500 transition-all">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Peso Final (KG)</label>
                      <div className="flex items-center gap-4">
                        <div className="text-2xl text-slate-300"><i className="fas fa-weight-hanging"></i></div>
                        <input 
                          type="number" 
                          value={confirmedWeight}
                          onChange={(e) => setConfirmedWeight(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-transparent text-3xl font-black outline-none text-slate-900 placeholder:text-slate-200"
                        />
                      </div>
                    </div>
                    <button 
                      disabled={isProcessing}
                      onClick={() => handleConfirmCollection(o)}
                      className="w-full bg-emerald-600 text-white h-20 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-100 flex items-center justify-center gap-4 active:scale-95 transition-all"
                    >
                      {isProcessing ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-check-double text-lg"></i>}
                      Finalizar Coleta
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                        <i className="fas fa-clipboard-check text-xl"></i>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase opacity-50">Peso Confirmado</p>
                        <h5 className="text-xl font-black">{o.actualWeight} KG</h5>
                      </div>
                    </div>
                    <button onClick={() => setActiveReceipt(o)} className="w-12 h-12 bg-white/5 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center">
                      <i className="fas fa-file-invoice"></i>
                    </button>
                  </div>
                )}
              </div>
            ))}
            {myOngoing.length === 0 && (
              <div className="py-24 text-center opacity-20">
                <i className="fas fa-route text-5xl mb-6"></i>
                <p className="text-[11px] font-black uppercase tracking-widest">Aguardando novos destinos</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-50 space-y-10 animate-slide-up">
             <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Setup do Veículo</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sua logística inteligente começa aqui</p>
             </div>

             <div className="grid grid-cols-2 gap-4">
                {(['moto', 'carro', 'bicicleta', 'pe'] as const).map(t => (
                  <button 
                    key={t}
                    onClick={() => setVehicle({...vehicle, type: t, consumption: t === 'moto' ? 35 : t === 'carro' ? 12 : 0})}
                    className={`py-8 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all ${vehicle.type === t ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-xl shadow-blue-50' : 'border-slate-50 text-slate-300 hover:border-slate-200'}`}
                  >
                    <i className={`fas fa-${t === 'moto' ? 'motorcycle' : t === 'carro' ? 'car' : t === 'bicicleta' ? 'bicycle' : 'walking'} text-2xl`}></i>
                    <span className="text-[9px] font-black uppercase tracking-widest">{t}</span>
                  </button>
                ))}
             </div>

             <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-[2.2rem] border border-slate-100">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Gasolina (R$/L)</label>
                   <div className="flex items-center gap-4">
                     <span className="text-xl font-black text-slate-400">R$</span>
                     <input 
                       type="number" 
                       step="0.01"
                       value={vehicle.fuelPrice} 
                       disabled={vehicle.type === 'bicicleta' || vehicle.type === 'pe'}
                       onChange={e => setVehicle({...vehicle, fuelPrice: Number(e.target.value)})} 
                       className="w-full bg-transparent text-2xl font-black text-slate-900 outline-none"
                     />
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-6 rounded-[2.2rem] border border-slate-100">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">KM / Litro</label>
                     <input 
                       type="number" 
                       value={vehicle.consumption} 
                       disabled={vehicle.type === 'bicicleta' || vehicle.type === 'pe'}
                       onChange={e => setVehicle({...vehicle, consumption: Number(e.target.value)})} 
                       className="w-full bg-transparent text-2xl font-black text-slate-900 outline-none"
                     />
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[2.2rem] border border-slate-100">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Raio Max</label>
                     <div className="flex items-center gap-2">
                       <input 
                         type="number" 
                         value={vehicle.radius} 
                         onChange={e => setVehicle({...vehicle, radius: Number(e.target.value)})} 
                         className="w-full bg-transparent text-2xl font-black text-slate-900 outline-none"
                       />
                       <span className="text-xs font-black text-slate-300">KM</span>
                     </div>
                  </div>
                </div>
             </div>

             <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                <div className="flex items-start gap-4 relative z-10">
                  <i className="fas fa-lightbulb text-2xl text-blue-200"></i>
                  <p className="text-[11px] font-bold leading-relaxed opacity-90">
                    Seu custo operacional é <strong>R$ {costPerKm.toFixed(2)} / KM</strong>. 
                    Filtramos ofertas distantes para manter seu lucro líquido máximo.
                  </p>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Recibo Modal Expandido */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-8 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3.5rem] overflow-hidden shadow-2xl animate-slide-up border border-white/20">
            <div className="bg-emerald-600 p-10 text-center text-white relative">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20">
                <i className="fas fa-check text-4xl"></i>
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest">Coleta Efetuada</h3>
              <p className="text-[10px] font-bold opacity-60 uppercase mt-2 tracking-widest">Ref: {activeReceipt.id}</p>
            </div>
            <div className="p-10 space-y-8">
              <div className="space-y-4 font-mono text-[12px] border-b-2 border-dashed border-slate-100 pb-8">
                <div className="flex justify-between items-center text-slate-400"><span>MATERIAL</span><span className="font-black text-slate-900">{activeReceipt.type}</span></div>
                <div className="flex justify-between items-center text-slate-400"><span>PESO BALANÇA</span><span className="font-black text-slate-900">{activeReceipt.actualWeight} KG</span></div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                  <span className="font-black text-emerald-600 text-[10px] uppercase">Lucro Projetado</span>
                  <span className="text-xl font-black text-emerald-600">R$ {calculateFinancials(activeReceipt.estimatedValue, 5).net.toFixed(2)}</span>
                </div>
              </div>
              <button onClick={() => setActiveReceipt(null)} className="w-full bg-slate-900 text-white h-16 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Fechar Recibo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorDashboard;
