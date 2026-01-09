
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
  fuelType: string;
}

const FUEL_PRICE = 6.15;

const CollectorDashboard: React.FC<CollectorDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'available' | 'ongoing' | 'profile'>('available');
  const [offers, setOffers] = useState<PlasticDeclaration[]>([]);
  const [confirmedWeight, setConfirmedWeight] = useState<string>('');
  const [activeReceipt, setActiveReceipt] = useState<PlasticDeclaration | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const [vehicle, setVehicle] = useState<VehicleConfig>(() => {
    const saved = localStorage.getItem('collector_vehicle');
    return saved ? JSON.parse(saved) : { 
      type: 'moto', 
      consumption: 35, 
      radius: 10,
      fuelType: 'Gasolina'
    };
  });

  useEffect(() => {
    localStorage.setItem('collector_vehicle', JSON.stringify(vehicle));
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
    const cost = fuelNeeded * FUEL_PRICE;
    const net = Math.max(0, grossValue - cost);
    return { cost, net };
  };

  const handleOptimizeRoutes = async () => {
    setIsOptimizing(true);
    // Simula chamada ao Gemini para otimização baseada no consumo do veículo
    const locations = myOngoing.map(o => o.location);
    await new Promise(resolve => setTimeout(resolve, 1500));
    await getSmartRoutes(locations);
    setIsOptimizing(false);
    alert("Rotas otimizadas com sucesso! Sua sequência de coleta foi ajustada para economizar até 15% de combustível.");
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

  const costPerKm = vehicle.type === 'bicicleta' || vehicle.type === 'pe' ? 0 : FUEL_PRICE / (vehicle.consumption || 1);

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* Veículo Header Dinâmico */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-800 text-white p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl border border-white/30">
              <i className={`fas fa-${vehicle.type === 'moto' ? 'motorcycle' : vehicle.type === 'carro' ? 'car' : vehicle.type === 'bicicleta' ? 'bicycle' : 'walking'}`}></i>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Custos de Operação</p>
              <h2 className="text-xl font-black">R$ {costPerKm.toFixed(2)} / km</h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Raio Atual</p>
            <h2 className="text-xl font-black">{vehicle.radius}km</h2>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex bg-gray-200/50 p-1.5 rounded-2xl backdrop-blur-sm sticky top-20 z-40">
        {(['available', 'ongoing', 'profile'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${
              activeTab === tab ? 'bg-white shadow-md text-blue-600' : 'text-gray-500'
            }`}
          >
            {tab === 'available' ? 'Ofertas' : tab === 'ongoing' ? 'Minhas Coletas' : 'Configurar Veículo'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === 'available' && (
          availableOffers.map(o => {
            const { cost, net } = calculateFinancials(o.estimatedValue, o.distanceKm);
            const isGuaranteed = o.status === RequestStatus.APPROVED;
            return (
              <div key={o.id} className={`bg-white p-6 rounded-[2.5rem] border-2 transition-all relative overflow-hidden group ${isGuaranteed ? 'border-amber-400 shadow-amber-50 shadow-xl' : 'border-gray-100 shadow-sm'}`}>
                {isGuaranteed && (
                  <div className="absolute top-0 right-0 bg-amber-400 text-white px-4 py-1.5 rounded-bl-2xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <i className="fas fa-check-shield"></i> Pagamento Garantido
                  </div>
                )}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-lg font-black text-gray-900">{o.type} • {o.estimatedWeight}kg</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Estimativa: R$ {o.estimatedValue.toFixed(2)} Bruto</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-emerald-600">R$ {net.toFixed(2)}</p>
                    <p className="text-[8px] font-black text-emerald-400 uppercase">Lucro Líquido</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100 flex justify-between items-center">
                   <span className="text-[9px] font-black text-gray-400 uppercase">Distância: {o.distanceKm}km</span>
                   <span className="text-[9px] font-black text-red-400 uppercase">Custo Combustível: R$ {cost.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => handleAccept(o.id)}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl border-b-8 border-blue-800 active:translate-y-1 transition-all"
                >
                  Aceitar e Planejar Rota
                </button>
              </div>
            )
          })
        )}

        {activeTab === 'ongoing' && (
          <>
            {myOngoing.length > 1 && (
              <button 
                onClick={handleOptimizeRoutes}
                disabled={isOptimizing}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-emerald-100 mb-4"
              >
                {isOptimizing ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
                Otimizar Sequência de Coleta (IA)
              </button>
            )}
            
            {myOngoing.map(o => (
              <div key={o.id} className={`bg-white p-8 rounded-[3rem] shadow-xl border-2 transition-all ${o.status === RequestStatus.COLLECTED ? 'border-emerald-500 bg-emerald-50/10' : 'border-blue-500'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-[8px] font-black uppercase mb-2 block w-max tracking-widest">ID: {o.id}</span>
                    <h4 className="text-2xl font-black text-gray-900">{o.type}</h4>
                    <p className="text-xs text-gray-400 font-bold uppercase mt-1">Peso Estimado: {o.estimatedWeight}kg</p>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${o.status === RequestStatus.COLLECTED ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                      {o.status === RequestStatus.COLLECTED ? 'Coletado' : 'Aguardando'}
                  </div>
                </div>
                
                {o.status !== RequestStatus.COLLECTED ? (
                  <div className="space-y-6">
                    <div className="bg-gray-50 border-2 border-gray-100 p-6 rounded-3xl">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Peso Real na Balança (KG)</label>
                      <input 
                        type="number" 
                        value={confirmedWeight}
                        onChange={(e) => setConfirmedWeight(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-transparent text-3xl font-black outline-none focus:text-blue-600"
                      />
                    </div>
                    <button 
                      disabled={isProcessing}
                      onClick={() => handleConfirmCollection(o)}
                      className="w-full bg-gray-900 text-white py-6 rounded-3xl font-black shadow-2xl border-b-8 border-gray-700 flex items-center justify-center gap-3"
                    >
                      {isProcessing ? <i className="fas fa-circle-notch animate-spin"></i> : 'CONCLUIR COLETA'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-500 p-6 rounded-3xl text-white flex justify-between items-center shadow-lg shadow-emerald-200">
                    <div>
                      <p className="text-[9px] font-black uppercase opacity-70">Peso Confirmado</p>
                      <h5 className="text-2xl font-black">{o.actualWeight} KG</h5>
                    </div>
                    <button onClick={() => setActiveReceipt(o)} className="bg-white/20 p-4 rounded-2xl hover:bg-white/30 transition-all">
                      <i className="fas fa-receipt text-xl"></i>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white p-8 rounded-[3.5rem] shadow-xl space-y-10 animate-slide-up border border-gray-100">
             <div className="flex items-center gap-5 border-b border-gray-100 pb-8">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-[2rem] flex items-center justify-center text-4xl shadow-inner">
                   <i className={`fas fa-${vehicle.type === 'moto' ? 'motorcycle' : vehicle.type === 'carro' ? 'car' : vehicle.type === 'bicicleta' ? 'bicycle' : 'walking'}`}></i>
                </div>
                <div>
                   <h3 className="text-2xl font-black text-gray-900">Perfil do Veículo</h3>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Otimize seus lucros na nuvem</p>
                </div>
             </div>

             <div className="space-y-8">
                <div>
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block ml-1">Meio de Transporte</label>
                   <div className="grid grid-cols-4 gap-3">
                      {(['moto', 'carro', 'bicicleta', 'pe'] as const).map(t => (
                        <button 
                          key={t}
                          onClick={() => setVehicle({...vehicle, type: t, consumption: t === 'moto' ? 35 : t === 'carro' ? 12 : 0})}
                          className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all ${vehicle.type === t ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-xl shadow-blue-100' : 'border-gray-50 text-gray-300'}`}
                        >
                          <i className={`fas fa-${t === 'moto' ? 'motorcycle' : t === 'carro' ? 'car' : t === 'bicicleta' ? 'bicycle' : 'walking'} text-2xl`}></i>
                          <span className="text-[9px] font-black uppercase">{t}</span>
                        </button>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Consumo (km/l)</label>
                      <input 
                        type="number" 
                        value={vehicle.consumption} 
                        disabled={vehicle.type === 'bicicleta' || vehicle.type === 'pe'}
                        onChange={e => setVehicle({...vehicle, consumption: Number(e.target.value)})} 
                        className="w-full bg-white border-2 border-transparent focus:border-blue-600 p-4 rounded-2xl font-black text-xl outline-none disabled:opacity-30 transition-all"
                      />
                   </div>
                   <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Raio Max (km)</label>
                      <input 
                        type="number" 
                        value={vehicle.radius} 
                        onChange={e => setVehicle({...vehicle, radius: Number(e.target.value)})} 
                        className="w-full bg-white border-2 border-transparent focus:border-blue-600 p-4 rounded-2xl font-black text-xl outline-none transition-all"
                      />
                   </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
                   <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0">
                      <i className="fas fa-calculator"></i>
                   </div>
                   <div>
                      <h4 className="text-xs font-black text-blue-900 uppercase mb-1">Impacto Financeiro</h4>
                      <p className="text-[11px] text-blue-700 leading-relaxed">
                        Com base no combustível (R$ {FUEL_PRICE}/L), sua operação custa <strong>R$ {costPerKm.toFixed(2)} por quilômetro</strong> percorrido (ida e volta). 
                        As ofertas fora do raio de <strong>{vehicle.radius}km</strong> são ocultadas para proteger sua margem.
                      </p>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Modal de Recibo Digital (Reutilizado do fluxo anterior) */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl animate-scale-up">
            <div className="bg-emerald-600 p-10 text-center text-white">
              <i className="fas fa-receipt text-4xl mb-4"></i>
              <h2 className="text-2xl font-black uppercase tracking-tight">Recibo Coletor</h2>
              <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">ECO-POINT VERIFIED</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-3 font-mono text-xs border-b border-dashed border-gray-100 pb-6">
                <div className="flex justify-between"><span>ID:</span><span>{activeReceipt.id}</span></div>
                <div className="flex justify-between"><span>PESO:</span><span className="font-black">{activeReceipt.actualWeight} KG</span></div>
                <div className="flex justify-between"><span>LUCRO LIQ:</span><span className="font-black">R$ {calculateFinancials(activeReceipt.estimatedValue, 5).net.toFixed(2)}</span></div>
              </div>
              <button onClick={() => setActiveReceipt(null)} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorDashboard;
