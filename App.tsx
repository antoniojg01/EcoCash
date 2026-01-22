
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth as firebaseAuth, checkFirebaseStatus } from './firebase';
import { User, UserRole } from './types';
import { cloud } from './services/cloudService';
import AuthPortal from './views/AuthPortal';
import ResidentDashboard from './views/ResidentDashboard';
import CollectorDashboard from './views/CollectorDashboard';
import PointDashboard from './views/PointDashboard';
import ProducerDashboard from './views/ProducerDashboard';
import ConsumerDashboard from './views/ConsumerDashboard';
import EcoDemocracy from './views/EcoDemocracy';
import SOSMundo from './views/SOSMundo';
import AnalyticsDashboard from './views/AnalyticsDashboard';
import EcoServices from './views/EcoServices';
import Hub from './views/Hub';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<'home' | 'democracy' | 'sos' | 'market' | 'services' | 'profile' | 'hub'>('hub');
  const [servicesSubView, setServicesSubView] = useState<string>('browse');
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState(checkFirebaseStatus());

  useEffect(() => {
    let unsubscribeFirestore: any = null;
    let unsubscribeAuth: any = null;

    const handleUserChange = async (userId: string) => {
      if (unsubscribeFirestore) unsubscribeFirestore();
      
      const initialUser = await cloud.getUser(userId);
      if (initialUser) {
        setUser(initialUser);
        setAuthLoading(false);
      } else if (!firebaseStatus.enabled) {
        const newUser = await cloud.createUserProfile(userId, { name: "Usuário Demo" });
        setUser(newUser);
        setAuthLoading(false);
      } else {
        const timer = setTimeout(() => setAuthLoading(false), 3000);
        return () => clearTimeout(timer);
      }

      unsubscribeFirestore = cloud.subscribeToUser(userId, (userData) => {
        if (userData) {
          setUser(userData);
          setAuthLoading(false);
        }
      });
    };

    const initAuth = () => {
      const status = checkFirebaseStatus();
      setFirebaseStatus(status);

      if (status.enabled && status.auth) {
        unsubscribeAuth = onAuthStateChanged(status.auth, (fbUser) => {
          if (fbUser) {
            handleUserChange(fbUser.uid);
          } else {
            setUser(null);
            setAuthLoading(false);
          }
        });
      } else {
        const demoUserId = localStorage.getItem('ecocash_demo_auth');
        if (demoUserId) {
          handleUserChange(demoUserId);
        } else {
          setUser(null);
          setAuthLoading(false);
        }
      }
    };

    initAuth();
    window.addEventListener('auth_change', initAuth);
    return () => {
      window.removeEventListener('auth_change', initAuth);
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  const handleLogout = async () => {
    const status = checkFirebaseStatus();
    if (status.enabled && status.auth) {
      await status.auth.signOut();
    }
    localStorage.removeItem('ecocash_demo_auth');
    localStorage.removeItem('ecocash_force_demo');
    setUser(null);
    setView('hub');
    window.dispatchEvent(new Event('auth_change'));
  };

  const switchRole = async (newRole: UserRole) => {
    if (user) {
      setShowRoleSwitcher(false);
      
      // Se o usuário não tem esse papel, adicionamos dinamicamente
      if (!user.roles.includes(newRole)) {
        const updatedRoles = [...user.roles, newRole];
        // Simulamos atualização do perfil no cloud
        const users = JSON.parse(localStorage.getItem('ecocash_users') || '[]');
        const idx = users.findIndex((u: any) => u.id === user.id);
        if (idx !== -1) {
          users[idx].roles = updatedRoles;
          localStorage.setItem('ecocash_users', JSON.stringify(users));
        }
      }
      
      await cloud.switchActiveRole(user.id, newRole);
      setView('home');
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Sincronizando Ecossistema...</p>
      </div>
    );
  }

  if (!user) return <AuthPortal />;

  const currentRole = user.activeRole || user.role || UserRole.RESIDENT;
  const allPossibleRoles = [
    UserRole.RESIDENT, 
    UserRole.COLLECTOR, 
    UserRole.POINT
  ];

  const themeConfig: Record<string, any> = {
    [UserRole.RESIDENT]: { primary: 'bg-emerald-600', secondary: 'bg-emerald-500', accent: 'text-emerald-400', headerBg: 'bg-[#475569]', label: 'MORADOR', icon: 'fa-house', card: 'border-emerald-400 text-emerald-500 bg-emerald-50' },
    [UserRole.COLLECTOR]: { primary: 'bg-blue-600', secondary: 'bg-blue-500', accent: 'text-blue-300', headerBg: 'bg-[#1e293b]', label: 'COLETOR', icon: 'fa-truck', card: 'border-blue-400 text-blue-500 bg-blue-50' },
    [UserRole.POINT]: { primary: 'bg-[#a855f7]', secondary: 'bg-[#b388eb]', accent: 'text-purple-300', headerBg: 'bg-[#575d66]', label: 'PONTO', icon: 'fa-shop', card: 'border-purple-400 text-purple-500 bg-purple-50' }
  };

  const theme = themeConfig[currentRole] || themeConfig[UserRole.RESIDENT];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#FFFFFF] relative">
      <div className="absolute top-0 left-0 right-0 z-50 p-6">
        <header className={`${view === 'sos' ? 'bg-red-800' : view === 'services' ? 'bg-indigo-900' : view === 'market' ? 'bg-orange-600' : view === 'hub' ? 'bg-slate-900' : theme.headerBg} px-6 py-8 rounded-[2.8rem] shadow-xl flex flex-col justify-between animate-fade-in overflow-hidden relative min-h-[160px] transition-colors duration-500`}>
          <div className="flex justify-between items-start relative z-10 w-full mb-2">
            <div onClick={() => setView('hub')} className="cursor-pointer flex-1">
              <span className={`text-[9px] font-black uppercase ${theme.accent} opacity-100 tracking-[0.2em] block mb-1`}>
                {view === 'hub' ? 'EcoCash Global Hub' : view === 'sos' ? 'Safety Awareness' : view === 'services' ? 'ECOSERV ON-DEMAND' : view === 'market' ? 'Energy Cloud Market' : `Perfil Ativo: ${theme.label}`}
              </span>
              <h1 className="text-4xl font-extrabold text-white leading-none tracking-tight truncate max-w-[180px]">
                {user.name.split(' ')[0]}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {/* ÍCONE DE TROCA DE PERFIL - MOSTRANDO APENAS OS PERFIS DISPONÍVEIS */}
              <button 
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className={`w-11 h-11 ${showRoleSwitcher ? 'bg-white text-slate-900' : 'bg-white/20 text-white'} rounded-xl flex items-center justify-center transition-all shadow-lg backdrop-blur-md relative active:scale-90`}
              >
                <i className="fas fa-user-gear text-sm"></i>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900"></span>
              </button>
              
              <div className="bg-white/10 px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-center backdrop-blur-md border border-white/5">
                 <span className="text-white font-black text-[10px]">R$ {user.balance.toFixed(2)}</span>
              </div>
              <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                <i className="fas fa-power-off text-xs"></i>
              </button>
            </div>
          </div>

          {/* MENU DE TROCA DE PERFIL - REDESENHADO PARA MOSTRAR APENAS OS 3 PRINCIPAIS */}
          {showRoleSwitcher && (
            <div className="absolute top-[100%] left-0 right-0 mt-4 mx-2 z-[60] bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] p-6 animate-slide-up border border-white/20">
               <div className="flex items-center justify-between mb-5 px-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escolha seu Papel de Ação</p>
                  <button onClick={() => setShowRoleSwitcher(false)} className="text-slate-300 hover:text-slate-500">
                    <i className="fas fa-times text-xs"></i>
                  </button>
               </div>
               
               <div className="flex flex-wrap justify-center gap-2">
                  {allPossibleRoles.map(r => {
                    const rTheme = themeConfig[r] || themeConfig[UserRole.RESIDENT];
                    const isActive = currentRole === r;
                    const isUnlocked = user.roles.includes(r);
                    
                    return (
                      <button 
                        key={r}
                        onClick={() => switchRole(r)}
                        className={`w-[30%] min-h-[75px] rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                          isActive 
                            ? `${rTheme.card} scale-105 shadow-md z-10` 
                            : 'border-slate-50 bg-slate-50 text-slate-300 opacity-60'
                        }`}
                      >
                         <i className={`fas ${rTheme.icon} ${isActive ? 'text-lg' : 'text-base'}`}></i>
                         <span className={`text-[8px] font-black uppercase tracking-tighter text-center leading-none ${isActive ? 'text-inherit' : 'text-slate-400'}`}>
                           {rTheme.label.split(' ')[0]}
                         </span>
                         {!isUnlocked && (
                           <i className="fas fa-plus-circle absolute top-1 right-1 text-[7px] text-emerald-400 opacity-50"></i>
                         )}
                      </button>
                    )
                  })}
               </div>
               
               <div className="mt-6 pt-4 border-t border-slate-50 text-center">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">EcoCash Ecosystem Engine</p>
               </div>
            </div>
          )}

          <div className="flex justify-between items-end relative z-10 w-full">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/40 backdrop-blur-sm">
                  <i className={`fas fa-${view === 'hub' ? 'grid-2' : view === 'sos' ? 'triangle-exclamation' : view === 'services' ? 'handshake' : view === 'market' ? 'bolt' : theme.icon} text-lg`}></i>
               </div>
               <div>
                  <p className={`text-[8px] font-black ${theme.accent} uppercase tracking-widest`}>
                    {view === 'hub' ? 'Menu de Campos' : view === 'sos' ? 'Proteção Global' : view === 'services' ? 'Marketplace P2P' : view === 'market' ? 'Energy Cloud' : 'Sincronizado'}
                  </p>
                  <p className="text-xs font-black text-white/60">
                    {view === 'hub' ? 'Multiverso EcoCash' : view === 'sos' ? 'Protocolo de Resposta' : view === 'services' ? 'Contratação Segura' : view === 'market' ? 'Gestão de Energia' : `Atuando como ${theme.label}`}
                  </p>
               </div>
            </div>
            {!firebaseStatus.enabled && (
              <div className="bg-amber-400 text-slate-900 text-[7px] font-black px-2 py-1 rounded-lg uppercase tracking-widest mb-1 shadow-lg">
                Demo
              </div>
            )}
          </div>
        </header>
      </div>

      <main className="flex-1 overflow-y-auto px-5 pt-[240px] pb-36 hide-scrollbar">
        {view === 'hub' && <Hub user={user} onNavigate={setView} onSubView={setServicesSubView} />}
        {view === 'home' && (
          <div className="animate-fade-in">
            {currentRole === UserRole.RESIDENT && <ResidentDashboard user={user} />}
            {currentRole === UserRole.COLLECTOR && <CollectorDashboard user={user} />}
            {currentRole === UserRole.POINT && <PointDashboard user={user} />}
          </div>
        )}
        {view === 'democracy' && <EcoDemocracy user={user} />}
        {view === 'sos' && <SOSMundo user={user} />}
        {view === 'market' && <AnalyticsDashboard user={user} />}
        {view === 'services' && <EcoServices user={user} initialTab={servicesSubView as any} />}
      </main>

      <div className="absolute bottom-6 left-0 right-0 px-6 z-40">
        <nav className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] h-20 flex justify-between items-center shadow-2xl border border-slate-100 px-6 overflow-x-auto hide-scrollbar">
          <NavButton active={view === 'hub'} icon="fa-house" label="HUB" theme={{...theme, navActive: 'bg-slate-900'}} onClick={() => setView('hub')} />
          <NavButton active={view === 'home'} icon="fa-recycle" label="PAINEL" theme={theme} onClick={() => setView('home')} />
          <NavButton active={view === 'market'} icon="fa-bolt" label="MERCADO" theme={{...theme, navActive: 'bg-orange-600'}} onClick={() => setView('market')} />
          <NavButton active={view === 'services'} icon="fa-handshake" label="SERVIÇOS" theme={{...theme, navActive: 'bg-indigo-600'}} onClick={() => setView('services')} />
          <NavButton active={view === 'sos'} icon="fa-circle-exclamation" label="SOS" theme={{...theme, navActive: 'bg-red-600'}} onClick={() => setView('sos')} />
        </nav>
      </div>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, icon: string, label: string, onClick: () => void, theme: any }> = ({ active, icon, label, onClick, theme }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center min-w-[60px]">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${active ? `${theme.navActive} text-white shadow-lg scale-110` : 'text-slate-300'}`}>
      <i className={`fas ${icon} text-base`}></i>
    </div>
    <span className={`text-[7px] font-black tracking-widest mt-1.5 ${active ? 'text-slate-900' : 'text-slate-300'}`}>{label}</span>
  </button>
);

export default App;
