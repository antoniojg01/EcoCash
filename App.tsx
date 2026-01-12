import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { cloud } from './services/cloudService';
import Login from './views/Login';
import ResidentDashboard from './views/ResidentDashboard';
import CollectorDashboard from './views/CollectorDashboard';
import PointDashboard from './views/PointDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'home' | 'history' | 'profile'>('home');

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
      {/* HEADER PREMIUM - FIEL AO SCREENSHOT */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4">
        <header className="bg-[#059669] px-6 py-6 rounded-[2.5rem] shadow-2xl flex justify-between items-center animate-fade-in overflow-hidden relative">
          {/* Círculo decorativo no topo */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <span className="text-[10px] font-extrabold uppercase text-emerald-200/40 tracking-[0.25em] mb-0.5 block">EcoCash Platform</span>
            <h1 className="text-3xl font-extrabold text-white leading-tight tracking-tight">{user.name.split(' ')[0]}</h1>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-[#10b981] px-4 py-2 rounded-2xl border border-white/10 shadow-inner flex items-center justify-center">
               <span className="text-white font-black text-xs">R$ {user.balance.toFixed(2)}</span>
            </div>
            <button onClick={handleLogout} className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all border border-white/5">
              <i className="fas fa-power-off text-sm"></i>
            </button>
          </div>
        </header>
      </div>

      {/* ÁREA DE CONTEÚDO COM PADDING PARA O HEADER */}
      <main className="flex-1 overflow-y-auto px-5 pt-36 pb-32 hide-scrollbar">
        {view === 'home' && (
          <div className="animate-fade-in">
            {user.role === UserRole.RESIDENT && <ResidentDashboard user={user} />}
            {user.role === UserRole.COLLECTOR && <CollectorDashboard user={user} />}
            {user.role === UserRole.POINT && <PointDashboard user={user} />}
          </div>
        )}

        {view === 'history' && (
          <div className="animate-fade-in py-10 space-y-6">
             <div className="flex flex-col items-center justify-center py-20 px-8 bg-slate-50 rounded-[3rem] border border-slate-100">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 text-3xl mb-8 shadow-sm">
                  <i className="fas fa-chart-line"></i>
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] text-center">Dashboard de Dados</h3>
                <p className="text-[10px] text-slate-400 font-bold text-center mt-4 leading-relaxed max-w-[200px]">Métricas detalhadas do seu impacto ambiental estarão aqui em breve.</p>
             </div>
          </div>
        )}

        {view === 'profile' && (
          <div className="animate-fade-in py-10 space-y-6">
             <div className="bg-slate-900 p-10 rounded-[3rem] text-white text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-[2.2rem] p-1 mx-auto mb-6 shadow-xl">
                  <div className="w-full h-full bg-slate-900 rounded-[2rem] flex items-center justify-center text-4xl">
                    <i className="fas fa-user-astronaut"></i>
                  </div>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">{user.name}</h3>
                <p className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.3em] mt-2">Membro Gold EcoCash</p>
                
                <button onClick={handleLogout} className="mt-10 w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors">
                  Encerrar Sessão
                </button>
             </div>
          </div>
        )}
      </main>

      {/* DOCK DE NAVEGAÇÃO REFINADO */}
      <div className="absolute bottom-8 left-0 right-0 px-8 z-40">
        <nav className="bg-white/80 backdrop-blur-2xl rounded-[2.8rem] h-20 px-10 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-white/50">
          <NavButton 
            active={view === 'home'} 
            icon="fa-house" 
            label="HOME" 
            onClick={() => setView('home')} 
          />
          <NavButton 
            active={view === 'history'} 
            icon="fa-chart-pie" 
            label="DADOS" 
            onClick={() => setView('history')} 
          />
          <NavButton 
            active={view === 'profile'} 
            icon="fa-user" 
            label="PERFIL" 
            onClick={() => setView('profile')} 
          />
        </nav>
      </div>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, icon: string, label: string, onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} className="relative flex flex-col items-center justify-center outline-none group">
    <div className={`flex flex-col items-center transition-all duration-300 ${active ? '-translate-y-1' : ''}`}>
      <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
        active 
          ? 'bg-[#059669] text-white nav-active-glow scale-110' 
          : 'text-slate-300 hover:text-slate-400'
      }`}>
        <i className={`fas ${icon} text-lg`}></i>
      </div>
      <span className={`text-[8px] font-extrabold tracking-[0.1em] mt-1.5 transition-colors ${active ? 'text-slate-900' : 'text-slate-300'}`}>
        {label}
      </span>
      {active && (
        <div className="w-1 h-1 bg-[#059669] rounded-full mt-1 animate-fade-in"></div>
      )}
    </div>
  </button>
);

export default App;