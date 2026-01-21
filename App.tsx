
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { cloud } from './services/cloudService';
import Login from './views/Login';
import ResidentDashboard from './views/ResidentDashboard';
import CollectorDashboard from './views/CollectorDashboard';
import PointDashboard from './views/PointDashboard';
import ProducerDashboard from './views/ProducerDashboard';
import ConsumerDashboard from './views/ConsumerDashboard';
import EcoDemocracy from './views/EcoDemocracy';
import SOSMundo from './views/SOSMundo';
import AnalyticsDashboard from './views/AnalyticsDashboard';
import PlatformMetrics from './views/PlatformMetrics';
import EcoServices from './views/EcoServices';
import Hub from './views/Hub';

interface VehicleConfig {
  type: 'moto' | 'carro' | 'bicicleta' | 'pe';
  consumption: number; 
  radius: number; 
  fuelPrice: number;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'home' | 'democracy' | 'sos' | 'market' | 'services' | 'profile' | 'hub'>('hub');
  const [servicesSubView, setServicesSubView] = useState<string>('browse');

  const [vehicle, setVehicle] = useState<VehicleConfig>(() => {
    const saved = localStorage.getItem('collector_vehicle_v2');
    return saved ? JSON.parse(saved) : { 
      type: 'moto', 
      consumption: 35, 
      radius: 10,
      fuelPrice: 6.15
    };
  });

  const isPoint = user?.role === UserRole.POINT;

  const universeTheme = isPoint ? {
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
    setView('hub');
  };

  const handleLogout = () => setUser(null);

  if (!user) return <Login onLogin={handleLogin} />;

  const handleNavigateFromHub = (target: any) => {
    setView(target);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#FFFFFF] relative">
      {/* HEADER PREMIUM DINÂMICO */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6">
        <header className={`${view === 'sos' ? 'bg-red-800' : view === 'services' ? 'bg-indigo-900' : view === 'market' ? 'bg-blue-900' : view === 'hub' ? 'bg-slate-900' : universeTheme.headerBg} px-6 py-8 rounded-[2.8rem] shadow-xl flex flex-col justify-between animate-fade-in overflow-hidden relative min-h-[160px] transition-colors duration-500`}>
          <div className={`absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none`}></div>
          
          <div className="flex justify-between items-start relative z-10 w-full mb-2">
            <div onClick={() => setView('hub')} className="cursor-pointer">
              <span className={`text-[9px] font-black uppercase ${universeTheme.accent} opacity-100 tracking-[0.2em] block mb-1`}>
                {view === 'hub' ? 'EcoCash Global Hub' : view === 'sos' ? 'Safety Awareness' : view === 'services' ? 'ECOSERV ON-DEMAND' : view === 'market' ? 'Energy Analytics' : universeTheme.subtext}
              </span>
              <h1 className="text-4xl font-extrabold text-white leading-none tracking-tight">
                {user.role === UserRole.POINT ? 'EcoPoint' : user.name.split(' ')[0]}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className={`${view === 'market' ? 'bg-blue-500' : view === 'services' ? 'bg-indigo-500' : universeTheme.secondary} px-4 py-2 rounded-full shadow-lg flex items-center justify-center transition-colors`}>
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
                  <i className={`fas fa-${view === 'hub' ? 'grid-2' : view === 'sos' ? 'triangle-exclamation' : view === 'services' ? 'handshake' : view === 'market' ? 'bolt' : user.role === UserRole.POINT ? 'motorcycle' : vehicle.type === 'moto' ? 'motorcycle' : vehicle.type === 'carro' ? 'car' : vehicle.type === 'bicicleta' ? 'bicycle' : 'walking'} text-lg`}></i>
               </div>
               <div>
                  <p className={`text-[8px] font-black ${universeTheme.accent} uppercase tracking-widest`}>
                    {view === 'hub' ? 'Menu de Campos' : view === 'sos' ? 'Proteção Global' : view === 'services' ? 'Marketplace P2P' : view === 'market' ? 'Energy Cloud' : user.role === UserRole.POINT ? 'LOGÍSTICA MOTO' : `Logística ${vehicle.type}`}
                  </p>
                  <p className="text-xs font-black text-white/60">
                    {view === 'hub' ? 'Multiverso EcoCash' : view === 'sos' ? 'Protocolo de Resposta' : view === 'services' ? 'Contratação Segura' : view === 'market' ? 'Dashboard Mercado' : user.role === UserRole.POINT ? 'R$ 0.18 / KM' : `R$ ${(vehicle.fuelPrice / (vehicle.consumption || 1)).toFixed(2)} / KM`}
                  </p>
               </div>
            </div>
            <div className="text-right">
               <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">
                 {view === 'services' ? 'TAXA ECO' : view === 'market' ? 'Market Spread' : 'EcoPoints'}
               </p>
               <p className="text-xl font-black text-white/60">
                 {view === 'services' ? '5%' : view === 'market' ? '15%' : `${user.points} pts`}
               </p>
            </div>
          </div>
        </header>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 overflow-y-auto px-5 pt-[240px] pb-36 hide-scrollbar">
        {view === 'hub' && (
          <Hub 
            user={user} 
            onNavigate={handleNavigateFromHub} 
            onSubView={(sub) => setServicesSubView(sub)} 
          />
        )}

        {view === 'home' && (
          <div className="animate-fade-in">
            {user.role === UserRole.RESIDENT && <ResidentDashboard user={user} />}
            {user.role === UserRole.COLLECTOR && <CollectorDashboard user={user} />}
            {user.role === UserRole.POINT && <PointDashboard user={user} />}
            {user.role === UserRole.PRODUCER && <ProducerDashboard user={user} />}
            {user.role === UserRole.CONSUMER && <ConsumerDashboard user={user} />}
          </div>
        )}

        {view === 'democracy' && (
          <EcoDemocracy user={user} />
        )}

        {view === 'sos' && (
          <SOSMundo user={user} />
        )}

        {view === 'market' && (
          <div className="space-y-10 animate-fade-in">
            <AnalyticsDashboard user={user} />
            <PlatformMetrics />
          </div>
        )}

        {view === 'services' && (
          <EcoServices user={user} initialTab={servicesSubView as any} />
        )}

        {view === 'profile' && (
          <div className="animate-fade-in space-y-6 pb-10 text-center">
             <div className={`${universeTheme.headerBg} py-12 px-6 rounded-[2.5rem] text-white text-center shadow-lg relative overflow-hidden flex flex-col items-center justify-center transition-colors duration-500`}>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/10">
                    <i className="fas fa-user-astronaut text-2xl text-white/60"></i>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-[0.1em]">{user.name.toUpperCase()}</h3>
                  <div className={`h-[2px] w-6 ${universeTheme.accent} my-3 rounded-full opacity-60`}></div>
                  <p className={`text-[9px] font-black uppercase ${universeTheme.accent} tracking-[0.3em]`}>Level {Math.floor(user.points / 500) + 1} Protector</p>
                </div>
             </div>
             <p className="text-slate-400 font-bold text-xs">Menu de Perfil em Desenvolvimento</p>
          </div>
        )}
      </main>

      <div className="absolute bottom-6 left-0 right-0 px-6 z-40">
        <nav className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] h-20 flex justify-between items-center shadow-2xl border border-slate-100 px-6 overflow-x-auto hide-scrollbar">
          <NavButton 
            active={view === 'hub'} 
            icon="fa-house" 
            label="HOME" 
            theme={{...universeTheme, navActive: 'bg-slate-900'}}
            onClick={() => setView('hub')} 
          />
          <NavButton 
            active={view === 'home'} 
            icon="fa-recycle" 
            label="DASHBOARD" 
            theme={universeTheme}
            onClick={() => setView('home')} 
          />
          <NavButton 
            active={view === 'services'} 
            icon="fa-handshake" 
            label="SERVIÇOS" 
            theme={{...universeTheme, navActive: 'bg-indigo-600'}}
            onClick={() => setView('services')} 
          />
          <NavButton 
            active={view === 'sos'} 
            icon="fa-circle-exclamation" 
            label="SOS" 
            theme={{...universeTheme, navActive: 'bg-red-600'}}
            onClick={() => setView('sos')} 
          />
        </nav>
      </div>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, icon: string, label: string, onClick: () => void, theme: any }> = ({ active, icon, label, onClick, theme }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center transition-all min-w-[60px]">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
      active 
        ? `${theme.navActive} text-white shadow-lg scale-110` 
        : 'text-slate-300'
    }`}>
      <i className={`fas ${icon} text-base`}></i>
    </div>
    <span className={`text-[7px] font-black tracking-widest mt-1.5 transition-colors ${active ? 'text-slate-900' : 'text-slate-300'}`}>
      {label}
    </span>
  </button>
);

export default App;
