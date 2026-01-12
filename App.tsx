
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
    <div className="flex flex-col h-full w-full overflow-hidden bg-white relative">
      {/* HEADER GLOBAL - FIEL AO DESIGN */}
      <header className="bg-[#059669] px-6 pt-12 pb-10 rounded-b-[3.5rem] shadow-xl flex justify-between items-center shrink-0 z-50">
        <div className="animate-fade-in">
          <span className="text-[10px] font-black uppercase text-emerald-100/60 tracking-[0.2em] mb-1.5 block">EcoCash Platform</span>
          <h1 className="text-xl font-extrabold text-white leading-tight tracking-tight">{user.name.split(' ')[0]}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/15 px-5 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md">
             <span className="text-white font-black text-xs">R$ {user.balance.toFixed(2)}</span>
          </div>
          <button onClick={handleLogout} className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all border border-white/10">
            <i className="fas fa-power-off text-sm"></i>
          </button>
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 overflow-y-auto px-6 pt-8 pb-40 hide-scrollbar">
        {view === 'home' && (
          <div className="animate-fade-in">
            {user.role === UserRole.RESIDENT && <ResidentDashboard user={user} />}
            {user.role === UserRole.COLLECTOR && <CollectorDashboard user={user} />}
            {user.role === UserRole.POINT && <PointDashboard user={user} />}
          </div>
        )}

        {view === 'history' && (
          <div className="animate-fade-in space-y-6 py-4">
             <div className="flex flex-col items-center justify-center py-20 px-6 bg-slate-50 rounded-[3rem] border border-slate-100">
                <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm flex items-center justify-center text-slate-300 text-3xl mb-8">
                  <i className="fas fa-chart-pie"></i>
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] text-center leading-relaxed">Seus Dados de Impacto</h3>
                <p className="text-[11px] text-slate-400 font-bold text-center mt-3 leading-relaxed max-w-[200px]">Gráficos e estatísticas estarão disponíveis em breve.</p>
             </div>
          </div>
        )}

        {view === 'profile' && (
          <div className="animate-fade-in space-y-8 py-4">
             <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="flex flex-col items-center relative z-10 text-center">
                  <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-[2.5rem] p-1 shadow-lg mb-6">
                    <div className="w-full h-full bg-slate-900 rounded-[2.2rem] flex items-center justify-center text-4xl">
                      <i className="fas fa-user-circle"></i>
                    </div>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight">{user.name}</h3>
                  <p className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.3em] mt-2">Membro Verificado</p>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* DOCK DE NAVEGAÇÃO AJUSTADO (FIEL À IMAGEM) */}
      <div className="absolute bottom-8 left-0 right-0 px-6 z-40">
        <nav className="bg-white/95 backdrop-blur-2xl rounded-[2.8rem] h-24 px-10 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-50/50">
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
  <button onClick={onClick} className="relative flex flex-col items-center justify-center outline-none group min-w-[64px]">
    <div className={`flex flex-col items-center gap-1.5 transition-all duration-400 ${active ? 'scale-100' : 'opacity-20 hover:opacity-40'}`}>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${active ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100' : 'text-slate-600'}`}>
        <i className={`fas ${icon} text-lg`}></i>
      </div>
      <div className="flex flex-col items-center mt-1">
        <span className={`text-[9px] font-black tracking-[0.15em] transition-colors ${active ? 'text-emerald-700' : 'text-slate-600'}`}>
          {label}
        </span>
        {active && (
          <div className="w-1 h-1 bg-emerald-600 rounded-full mt-1 animate-fade-in"></div>
        )}
      </div>
    </div>
  </button>
);

export default App;
