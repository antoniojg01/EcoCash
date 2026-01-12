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
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#F8FAFC] relative">
      {/* HEADER AJUSTADO - FIEL À IMAGEM */}
      <div className="px-5 pt-4 z-50">
        <header className="bg-[#059669] px-6 py-5 rounded-[2.5rem] shadow-lg flex justify-between items-center animate-fade-in">
          <div>
            <span className="text-[9px] font-bold uppercase text-emerald-100/50 tracking-[0.2em] mb-0.5 block">EcoCash Platform</span>
            <h1 className="text-2xl font-extrabold text-white leading-tight tracking-tight">{user.name.split(' ')[0]}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-md">
               <span className="text-white font-bold text-xs">R$ {user.balance.toFixed(2)}</span>
            </div>
            <button onClick={handleLogout} className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all border border-white/5">
              <i className="fas fa-power-off text-xs"></i>
            </button>
          </div>
        </header>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 overflow-y-auto px-5 pt-6 pb-32 hide-scrollbar">
        {view === 'home' && (
          <div className="animate-fade-in">
            {user.role === UserRole.RESIDENT && <ResidentDashboard user={user} />}
            {user.role === UserRole.COLLECTOR && <CollectorDashboard user={user} />}
            {user.role === UserRole.POINT && <PointDashboard user={user} />}
          </div>
        )}

        {view === 'history' && (
          <div className="animate-fade-in space-y-6">
             <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 text-2xl mb-6">
                  <i className="fas fa-chart-pie"></i>
                </div>
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] text-center">Dados de Impacto</h3>
                <p className="text-[10px] text-slate-400 font-bold text-center mt-3 leading-relaxed max-w-[180px]">Gráficos estarão disponíveis em breve.</p>
             </div>
          </div>
        )}

        {view === 'profile' && (
          <div className="animate-fade-in space-y-6">
             <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl">
                <div className="flex flex-col items-center relative z-10 text-center">
                  <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-[1.8rem] p-1 shadow-lg mb-5">
                    <div className="w-full h-full bg-slate-900 rounded-[1.6rem] flex items-center justify-center text-3xl">
                      <i className="fas fa-user-circle"></i>
                    </div>
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight">{user.name}</h3>
                  <p className="text-[9px] font-black uppercase text-emerald-400 tracking-[0.3em] mt-1.5">Membro Verificado</p>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* NAVEGAÇÃO AJUSTADA - FIEL À IMAGEM */}
      <div className="absolute bottom-6 left-0 right-0 px-6 z-40">
        <nav className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] h-20 px-8 flex justify-between items-center shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-white/50">
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
  <button onClick={onClick} className="relative flex flex-col items-center justify-center group min-w-[60px] outline-none">
    <div className="flex flex-col items-center gap-1">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
        active 
          ? 'bg-[#059669] text-white nav-active-glow' 
          : 'text-slate-300 hover:text-slate-400'
      }`}>
        <i className={`fas ${icon} text-base`}></i>
      </div>
      <div className="flex flex-col items-center">
        <span className={`text-[8px] font-bold tracking-[0.1em] transition-colors ${active ? 'text-slate-800' : 'text-slate-300'}`}>
          {label}
        </span>
        {active && (
          <div className="w-1 h-1 bg-[#059669] rounded-full mt-0.5 animate-fade-in"></div>
        )}
      </div>
    </div>
  </button>
);

export default App;