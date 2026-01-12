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

  // Cálculo de nível para o perfil
  const levelProgress = Math.min(100, (user.totalRecycledKg / 50) * 100);
  const nextLevelKg = 50 - user.totalRecycledKg;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white relative">
      {/* HEADER GLOBAL */}
      <header className="bg-[#059669] px-6 pt-12 pb-10 rounded-b-[3rem] shadow-xl flex justify-between items-center shrink-0 z-50">
        <div className="animate-fade-in">
          <span className="text-[10px] font-black uppercase text-emerald-100/60 tracking-[0.2em] mb-1.5 block">EcoCash Platform</span>
          <h1 className="text-xl font-extrabold text-white leading-tight tracking-tight">{user.name.split(' ')[0]}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 px-4 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md">
             <span className="text-white font-black text-xs">R$ {user.balance.toFixed(2)}</span>
          </div>
          <button onClick={handleLogout} className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all hover:bg-white/20">
            <i className="fas fa-power-off text-sm"></i>
          </button>
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 overflow-y-auto px-6 pt-6 pb-40 hide-scrollbar">
        {view === 'home' && (
          <div className="animate-fade-in">
            {user.role === UserRole.RESIDENT && <ResidentDashboard user={user} />}
            {user.role === UserRole.COLLECTOR && <CollectorDashboard user={user} />}
            {user.role === UserRole.POINT && <PointDashboard user={user} />}
          </div>
        )}

        {view === 'history' && (
          <div className="animate-fade-in space-y-6 py-4">
             <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm flex items-center justify-center text-slate-300 text-3xl mb-6">
                  <i className="fas fa-receipt"></i>
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest text-center">Histórico Digital</h3>
                <p className="text-[11px] text-slate-400 font-bold text-center mt-2 leading-relaxed">Suas transações recentes aparecerão aqui após a sincronização com a nuvem.</p>
             </div>
          </div>
        )}

        {view === 'profile' && (
          <div className="animate-fade-in space-y-8 py-4">
             {/* Card de Identidade */}
             <div className="bg-slate-900 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="flex flex-col items-center relative z-10 text-center">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-[2.5rem] p-1 shadow-lg">
                      <div className="w-full h-full bg-slate-900 rounded-[2.2rem] flex items-center justify-center text-4xl">
                        <i className="fas fa-user-astronaut"></i>
                      </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-full border-4 border-slate-900 flex items-center justify-center text-[10px]">
                      <i className="fas fa-check"></i>
                    </div>
                  </div>
                  <h3 className="text-xl font-black">{user.name}</h3>
                  <p className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.2em] mt-1">Nível 02 • Guardião Ambiental</p>
                </div>

                <div className="mt-8 space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                    <span>Progresso Nível 3</span>
                    <span>{levelProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${levelProgress}%` }}></div>
                  </div>
                  <p className="text-[9px] font-bold text-center opacity-40 italic">Faltam {nextLevelKg.toFixed(1)}kg para o próximo selo</p>
                </div>
             </div>

             {/* Grid de Stats */}
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
                    <i className="fas fa-seedling"></i>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reciclado</p>
                  <p className="text-lg font-black text-slate-800">{user.totalRecycledKg}kg</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
                    <i className="fas fa-tint-slash"></i>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CO2 Evitado</p>
                  <p className="text-lg font-black text-slate-800">{(user.totalRecycledKg * 1.2).toFixed(1)}kg</p>
                </div>
             </div>

             {/* Selos de Conquista */}
             <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Conquistas Desbloqueadas</h4>
                <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                  <AchievementBadge icon="fa-rocket" color="bg-orange-500" label="Pioneiro" unlocked={true} />
                  <AchievementBadge icon="fa-leaf" color="bg-emerald-500" label="Eco-Ativo" unlocked={true} />
                  <AchievementBadge icon="fa-award" color="bg-blue-500" label="Mestre PET" unlocked={false} />
                  <AchievementBadge icon="fa-recycle" color="bg-purple-500" label="Zero Lixo" unlocked={false} />
                </div>
             </div>

             {/* Ações Rápidas */}
             <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Configurações da Conta</h4>
                <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-50 active:scale-95 transition-all">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-bell text-slate-400 text-sm"></i>
                    <span className="text-xs font-bold text-slate-800">Notificações</span>
                  </div>
                  <i className="fas fa-chevron-right text-[10px] text-slate-300"></i>
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-50 active:scale-95 transition-all">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-shield-alt text-slate-400 text-sm"></i>
                    <span className="text-xs font-bold text-slate-800">Privacidade</span>
                  </div>
                  <i className="fas fa-chevron-right text-[10px] text-slate-300"></i>
                </button>
             </div>
          </div>
        )}
      </main>

      {/* DOCK DE NAVEGAÇÃO PREMIUM */}
      <div className="absolute bottom-6 left-0 right-0 px-8 z-40">
        <nav className="glass-effect rounded-[2.2rem] h-20 px-8 flex justify-between items-center shadow-2xl border border-white/40 ring-1 ring-black/5">
          <NavButton 
            active={view === 'home'} 
            icon="fa-grid-2" 
            label="Home" 
            onClick={() => setView('home')} 
          />
          <NavButton 
            active={view === 'history'} 
            icon="fa-chart-pie-simple" 
            label="Dados" 
            onClick={() => setView('history')} 
          />
          <NavButton 
            active={view === 'profile'} 
            icon="fa-user-astronaut" 
            label="Perfil" 
            onClick={() => setView('profile')} 
          />
        </nav>
      </div>
    </div>
  );
};

const AchievementBadge: React.FC<{ icon: string, color: string, label: string, unlocked: boolean }> = ({ icon, color, label, unlocked }) => (
  <div className={`shrink-0 flex flex-col items-center gap-2 ${unlocked ? 'opacity-100' : 'opacity-30'}`}>
    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-xl text-white shadow-lg ${unlocked ? color : 'bg-slate-200 text-slate-400'}`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">{label}</span>
  </div>
);

const NavButton: React.FC<{ active: boolean, icon: string, label: string, onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} className="relative flex flex-col items-center justify-center group outline-none">
    <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'scale-110 -translate-y-1' : 'opacity-40 group-hover:opacity-60'}`}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-900'}`}>
        <i className={`fas ${icon} ${active ? 'text-lg' : 'text-base'}`}></i>
      </div>
      <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'text-emerald-700 block' : 'hidden'}`}>
        {label}
      </span>
    </div>
    {active && <div className="nav-indicator"></div>}
  </button>
);

export default App;