
import React, { useState, useEffect } from 'react';
import { UserRole, User } from './types';
import { cloud } from './services/cloudService';
import ResidentDashboard from './views/ResidentDashboard';
import CollectorDashboard from './views/CollectorDashboard';
import PointDashboard from './views/PointDashboard';
import Login from './views/Login';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Sync with "Cloud" events
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-emerald-600 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black flex items-center gap-2">
              <i className="fas fa-recycle"></i> EcoCash
            </h1>
            <span className="bg-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-400/50">CLOUD ACTIVE</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{currentUser.name}</p>
              <p className="text-sm font-black">R$ {currentUser.balance.toFixed(2)}</p>
            </div>
            <button 
              onClick={logout}
              className="w-10 h-10 bg-emerald-700/50 hover:bg-emerald-800 rounded-2xl transition-all flex items-center justify-center border border-emerald-500/30"
            >
              <i className="fas fa-power-off"></i>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {currentUser.role === UserRole.RESIDENT && <ResidentDashboard user={currentUser} />}
        {currentUser.role === UserRole.COLLECTOR && <CollectorDashboard user={currentUser} />}
        {currentUser.role === UserRole.POINT && <PointDashboard user={currentUser} />}
      </main>

      <nav className="sm:hidden bg-white/80 backdrop-blur-md border-t border-gray-100 fixed bottom-0 left-0 right-0 px-6 py-4 flex justify-around items-center z-50 shadow-2xl">
        <button className="flex flex-col items-center text-emerald-600">
          <i className="fas fa-house-chimney text-lg"></i>
          <span className="text-[9px] mt-1 font-black uppercase tracking-widest">Painel</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <i className="fas fa-clock-rotate-left text-lg"></i>
          <span className="text-[9px] mt-1 font-black uppercase tracking-widest">Histórico</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <i className="fas fa-wallet text-lg"></i>
          <span className="text-[9px] mt-1 font-black uppercase tracking-widest">Carteira</span>
        </button>
      </nav>
      <div className="h-20 sm:hidden"></div>
    </div>
  );
};

export default App;
