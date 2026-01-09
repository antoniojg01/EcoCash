
import React, { useState, useEffect } from 'react';
import { UserRole, User } from './types';
import { cloud } from './services/cloudService';
import ResidentDashboard from './views/ResidentDashboard';
import CollectorDashboard from './views/CollectorDashboard';
import PointDashboard from './views/PointDashboard';
import Login from './views/Login';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const handleSync = () => {
      if (currentUser) {
        const updated = cloud.getUser(currentUser.id);
        if (updated) setCurrentUser(updated);
      }
    };
    window.addEventListener('cloud_update', handleSync);
    return () => window.removeEventListener('cloud_update', handleSync);
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 sm:bg-slate-200 flex justify-center items-start">
      {/* Container Principal: Comportamento de Mobile App */}
      <div className="w-full max-w-md min-h-screen bg-slate-50 flex flex-col shadow-2xl relative overflow-hidden">
        
        <header className="bg-emerald-600 text-white px-6 py-5 sticky top-0 z-50 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl border border-white/30">
              <i className="fas fa-recycle text-xl"></i>
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">EcoCash</h1>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Cloud Sync Active</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[9px] font-bold opacity-70 uppercase leading-none mb-1">{currentUser.name}</p>
              <p className="text-sm font-black">R$ {currentUser.balance.toFixed(2)}</p>
            </div>
            <button 
              onClick={logout}
              className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center justify-center border border-white/20"
            >
              <i className="fas fa-power-off text-sm"></i>
            </button>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 overflow-y-auto">
          {currentUser.role === UserRole.RESIDENT && <ResidentDashboard user={currentUser} />}
          {currentUser.role === UserRole.COLLECTOR && <CollectorDashboard user={currentUser} />}
          {currentUser.role === UserRole.POINT && <PointDashboard user={currentUser} />}
        </main>

        {/* Tab Bar Estilo App Nativo */}
        <nav className="glass-effect border-t border-slate-200 px-8 py-4 flex justify-around items-center sticky bottom-0 z-50 rounded-t-3xl shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
          <button className="flex flex-col items-center gap-1 group">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-emerald-600 bg-emerald-50 transition-all group-active:scale-90">
              <i className="fas fa-grid-2 text-lg"></i>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Painel</span>
          </button>
          <button className="flex flex-col items-center gap-1 group text-slate-400">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all group-active:scale-90">
              <i className="fas fa-clock-rotate-left text-lg"></i>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Atividade</span>
          </button>
          <button className="flex flex-col items-center gap-1 group text-slate-400">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all group-active:scale-90">
              <i className="fas fa-wallet text-lg"></i>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Carteira</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default App;
