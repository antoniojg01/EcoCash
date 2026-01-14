
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { cloud } from './services/cloudService';
import Login from './views/Login';
import ResidentDashboard from './views/ResidentDashboard';
import CollectorDashboard from './views/CollectorDashboard';
import PointDashboard from './views/PointDashboard';
import ProducerDashboard from './views/ProducerDashboard';
import ConsumerDashboard from './views/ConsumerDashboard';

interface VehicleConfig {
  type: 'moto' | 'carro' | 'bicicleta' | 'pe';
  consumption: number; 
  radius: number; 
  fuelPrice: number;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'home' | 'profile'>('home');

  const [vehicle, setVehicle] = useState<VehicleConfig>(() => {
    const saved = localStorage.getItem('collector_vehicle_v2');
    return saved ? JSON.parse(saved) : { 
      type: 'moto', 
      consumption: 35, 
      radius: 10,
      fuelPrice: 6.15
    };
  });

  const isEnergyUniverse = user && [UserRole.PRODUCER, UserRole.CONSUMER].includes(user.role);
  const isPoint = user?.role === UserRole.POINT;

  const universeTheme = isEnergyUniverse ? {
    primary: 'bg-blue-600',
    secondary: 'bg-cyan-500',
    accent: 'text-cyan-400',
    headerBg: 'bg-[#1e293b]',
    navActive: 'bg-blue-600',
    subtext: 'Energy Cloud Active'
  } : isPoint ? {
    primary: 'bg-[#b388eb]',
    secondary: 'bg-[#10b981]',
    accent: 'text-[#10b981]',
    headerBg: 'bg-[#575d66]', 
    navActive: 'bg-[#10b981]',
    subtext: 'Circular Economy Active'
  } : {
    primary: 'bg-emerald-600',
    secondary: 'bg-emerald-500',
    accent: 'text-emerald-400',
    headerBg: 'bg-[#475569]',
    navActive: 'bg-[#10b981]',
    subtext: 'Circular Economy Active'
  };

  useEffect(() => {
    if (user?.role === UserRole.COLLECTOR) {
      localStorage.setItem('collector_vehicle_v2', JSON.stringify(vehicle));
      window.dispatchEvent(new Event('vehicle_settings_updated'));
    }
  }, [vehicle, user]);

  useEffect(() => {
    if (!user) return;
    const handleSync = () => {
      const updatedUser = cloud.getUser(user.id);
      if (updatedUser) setUser({...updatedUser});
    };
    window.addEventListener('cloud_update', handleSync);
    return () => window.removeEventListener('cloud_update', handleSync);
  }, [user?.id]);

  const handleLogin = (u: User) => {
    setUser(u);
    setView('home');
  };

  const handleLogout = () => setUser(null);

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#FFFFFF] relative">
      {/* HEADER PREMIUM DINÂMICO */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6">
        <header className={`${universeTheme.headerBg} px-6 py-8 rounded-[2.8rem] shadow-xl flex flex-col justify-between animate-fade-in overflow-hidden relative min-h-[160px] transition-colors duration-500`}>
          <div className={`absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none`}></div>
          
          <div className="flex justify-between items-start relative z-10 w-full mb-2">
            <div>
              <span className={`text-[9px] font-black uppercase ${universeTheme.accent} opacity-100 tracking-[0.2em] block mb-1`}>{universeTheme.subtext}</span>
              <h1 className="text-4xl font-extrabold text-white leading-none tracking-tight">
                {user.role === UserRole.POINT ? 'EcoPoint' : user.name.split(' ')[0]}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className={`${universeTheme.secondary} px-4 py-2 rounded-full shadow-lg flex items-center justify-center`}>
                 <span className="text-white font-black text-[10px]">R$ {user.balance.toFixed(2)}</span>
              </div>
              <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                <i className="fas fa-power-off text-xs"></i>
              </button>
            </div>
          </div>

          <div className="flex justify-between items-end relative z-10 w-full">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/40">
                  <i className={`fas fa-${user.role === UserRole.PRODUCER ? 'sun' : user.role === UserRole.CONSUMER ? 'bolt-lightning' : user.role === UserRole.POINT ? 'motorcycle' : vehicle.type === 'moto' ? 'motorcycle' : vehicle.type === 'carro' ? 'car' : vehicle.type === 'bicicleta' ? 'bicycle' : 'walking'} text-lg`}></i>
               </div>
               <div>
                  <p className={`text-[8px] font-black ${universeTheme.accent} uppercase tracking-widest`}>
                    {user.role === UserRole.POINT ? 'LOGÍSTICA MOTO' : isEnergyUniverse ? 'REDE ENERGÉTICA' : `Logística ${vehicle.type}`}
                  </p>
                  <p className="text-xs font-black text-white/60">
                    {user.role === UserRole.PRODUCER 
                      ? `${user.energyMetrics?.dailyKwh.toFixed(1)} kWh Gerados`
                      : user.role === UserRole.CONSUMER
                      ? `Fatura de ${user.consumerMetrics?.currentBill.dueDate}`
                      : user.role === UserRole.POINT
                      ? 'R$ 0.18 / KM'
                      : `R$ ${(vehicle.fuelPrice / (vehicle.consumption || 1)).toFixed(2)} / KM`
                    }
                  </p>
               </div>
            </div>
            <div className="text-right">
               <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">
                 {user.role === UserRole.PRODUCER ? 'Capacidade' : user.role === UserRole.CONSUMER ? 'Economia' : 'Raio de Coleta'}
               </p>
               <p className="text-xl font-black text-white/60">
                 {user.role === UserRole.PRODUCER ? `${user.energyMetrics?.systemCapacityKwp}kWp` : user.role === UserRole.CONSUMER ? `-${Math.round((1 - (user.consumerMetrics?.currentBill.discountedValue! / user.consumerMetrics?.currentBill.originalValue!)) * 100)}%` : `${vehicle.radius}km`}
               </p>
            </div>
          </div>
        </header>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 overflow-y-auto px-5 pt-[240px] pb-36 hide-scrollbar">
        {view === 'home' && (
          <div className="animate-fade-in">
            {user.role === UserRole.RESIDENT && <ResidentDashboard user={user} />}
            {user.role === UserRole.COLLECTOR && <CollectorDashboard user={user} />}
            {user.role === UserRole.POINT && <PointDashboard user={user} />}
            {user.role === UserRole.PRODUCER && <ProducerDashboard user={user} />}
            {user.role === UserRole.CONSUMER && <ConsumerDashboard user={user} />}
          </div>
        )}

        {view === 'profile' && (
          <div className="animate-fade-in space-y-6 pb-10">
             {/* BANNER PRINCIPAL DO PERFIL */}
             <div className={`${universeTheme.headerBg} py-12 px-6 rounded-[2.5rem] text-white text-center shadow-lg relative overflow-hidden flex flex-col items-center justify-center transition-colors duration-500`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-500/10 rounded-full -ml-8 -mb-8 blur-xl opacity-20"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/10">
                    <i className="fas fa-user-astronaut text-2xl text-white/60"></i>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-[0.1em]">{user.name.toUpperCase()}</h3>
                  <div className={`h-[2px] w-6 ${universeTheme.accent} my-3 rounded-full opacity-60`}></div>
                  <p className={`text-[9px] font-black uppercase ${universeTheme.accent} tracking-[0.3em]`}>Membro Nível Premium</p>
                </div>
             </div>

             {/* SEÇÕES DE INFORMAÇÃO */}
             <div className="space-y-4">
                
                {/* CALCULADORA DE LUCRO PARA COLETOR */}
                {user.role === UserRole.COLLECTOR && (
                  <CollectorProfitCalculator vehicle={vehicle} setVehicle={setVehicle} />
                )}

                {/* CARD DE IMPACTO AMBIENTAL */}
                <div className="bg-slate-50 p-8 rounded-[2.8rem] border border-slate-100 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                      <i className="fas fa-leaf"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight">Impacto Ambiental</h4>
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Contribuição Acumulada</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-[2rem] shadow-sm">
                      <p className="text-[14px] font-black text-slate-800">12.5 ton</p>
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">CO2 Evitados</p>
                    </div>
                    <div className="bg-white p-5 rounded-[2rem] shadow-sm">
                      <p className="text-[14px] font-black text-slate-800">85</p>
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Árvores Plantadas</p>
                    </div>
                  </div>
                </div>

                {/* CONFIGURAÇÕES DE CONTA */}
                <div className="bg-white p-8 rounded-[2.8rem] border border-slate-50 shadow-sm space-y-6">
                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">Configurações</h4>
                  <div className="space-y-2">
                    <ProfileOption icon="fa-shield-halved" label="Segurança & Biometria" />
                    <ProfileOption icon="fa-bell" label="Notificações de Mercado" />
                    <ProfileOption icon="fa-wallet" label="Dados de Pagamento" />
                    <ProfileOption icon="fa-circle-question" label="Centro de Suporte" />
                  </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* DOCK DE NAVEGAÇÃO SIMPLIFICADO */}
      <div className="absolute bottom-6 left-0 right-0 px-10 z-40">
        <nav className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] h-20 flex justify-center items-center shadow-2xl border border-slate-100 px-6 gap-12">
          <NavButton 
            active={view === 'home'} 
            icon="fa-house" 
            label="HOME" 
            theme={universeTheme}
            onClick={() => setView('home')} 
          />
          <NavButton 
            active={view === 'profile'} 
            icon="fa-user" 
            label="PERFIL" 
            theme={universeTheme}
            onClick={() => setView('profile')} 
          />
        </nav>
      </div>
    </div>
  );
};

const CollectorProfitCalculator: React.FC<{ vehicle: VehicleConfig, setVehicle: React.Dispatch<React.SetStateAction<VehicleConfig>> }> = ({ vehicle, setVehicle }) => {
  const [simWeight, setSimWeight] = useState('10');
  const [simGrossValue, setSimGrossValue] = useState('35');
  const [simDistance, setSimDistance] = useState('3');

  const weightNum = parseFloat(simWeight) || 0;
  const grossNum = parseFloat(simGrossValue) || 0;
  const distNum = parseFloat(simDistance) || 0;

  const fuelCost = (vehicle.type === 'bicicleta' || vehicle.type === 'pe') 
    ? 0 
    : ((distNum * 2) / (vehicle.consumption || 1)) * vehicle.fuelPrice;
  
  const netProfit = grossNum - fuelCost;

  return (
    <div className="bg-white p-8 rounded-[2.8rem] border border-slate-100 shadow-sm space-y-8 animate-slide-up">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-sm">
          <i className="fas fa-calculator text-lg"></i>
        </div>
        <div>
           <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Simulador de Lucro</h4>
           <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Baseado no seu veículo: {vehicle.type}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Peso (KG)</label>
          <input 
            type="number" 
            value={simWeight}
            onChange={e => setSimWeight(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-black text-xs outline-none focus:border-blue-200"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Venda (R$)</label>
          <input 
            type="number" 
            value={simGrossValue}
            onChange={e => setSimGrossValue(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-black text-xs outline-none focus:border-blue-200"
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Distância Ida/Volta (KM)</label>
          <input 
            type="number" 
            value={simDistance}
            onChange={e => setSimDistance(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-black text-xs outline-none focus:border-blue-200"
          />
        </div>
      </div>

      <div className="bg-[#1e293b] p-6 rounded-[2.2rem] text-white space-y-4">
         <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gasto Combustível</span>
            <span className="text-sm font-bold text-red-400">- R$ {fuelCost.toFixed(2)}</span>
         </div>
         <div className="h-[1px] bg-white/5 w-full"></div>
         <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Lucro Líquido</span>
            <span className="text-2xl font-black text-emerald-400">R$ {netProfit.toFixed(2)}</span>
         </div>
         <div className="flex justify-between items-center pt-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Margem Real p/ KG</span>
            <span className="text-[11px] font-bold text-white/60">R$ {(weightNum > 0 ? netProfit / weightNum : 0).toFixed(2)}/KG</span>
         </div>
      </div>

      <div className="pt-2">
         <button 
           onClick={() => {
              const p = prompt("Novo Preço Combustível (R$):", vehicle.fuelPrice.toString());
              if (p && !isNaN(parseFloat(p))) {
                 setVehicle(prev => ({...prev, fuelPrice: parseFloat(p)}));
              }
           }}
           className="w-full h-14 rounded-2xl border border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
         >
           <i className="fas fa-gas-pump"></i>
           Ajustar Preço Gasolina (R$ {vehicle.fuelPrice.toFixed(2)})
         </button>
      </div>
    </div>
  );
}

const ProfileOption: React.FC<{ icon: string, label: string }> = ({ icon, label }) => (
  <button className="w-full flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl hover:bg-slate-100 transition-colors group">
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors shadow-sm">
        <i className={`fas ${icon} text-xs`}></i>
      </div>
      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
    </div>
    <i className="fas fa-chevron-right text-slate-200 text-[10px]"></i>
  </button>
);

const NavButton: React.FC<{ active: boolean, icon: string, label: string, onClick: () => void, theme: any }> = ({ active, icon, label, onClick, theme }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center transition-all min-w-[64px]">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
      active 
        ? `${theme.navActive} text-white shadow-lg` 
        : 'text-slate-300'
    }`}>
      <i className={`fas ${icon} text-lg`}></i>
    </div>
    <span className={`text-[8px] font-black tracking-widest mt-1.5 transition-colors ${active ? 'text-slate-900' : 'text-slate-300'}`}>
      {label}
    </span>
  </button>
);

export default App;
