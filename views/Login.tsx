
import React from 'react';
import { User, UserRole } from '../types';
import { cloud } from '../services/cloudService';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const users = cloud.getUsers();

  const getRoleStyle = (role: UserRole) => {
    switch (role) {
      case UserRole.RESIDENT:
        return { color: 'bg-[#10b981]', icon: 'fa-house', label: 'MORADOR' };
      case UserRole.COLLECTOR:
        return { color: 'bg-[#3b82f6]', icon: 'fa-truck', label: 'COLETOR' };
      case UserRole.POINT:
        return { color: 'bg-[#a855f7]', icon: 'fa-shop', label: 'PONTO DE COMPRA' };
      case UserRole.PRODUCER:
        return { color: 'bg-[#f59e0b]', icon: 'fa-sun', label: 'PRODUTOR SOLAR' };
      case UserRole.CONSUMER:
        return { color: 'bg-[#06b6d4]', icon: 'fa-bolt-lightning', label: 'CONSUMIDOR (ECONOMIA)' };
      default:
        return { color: 'bg-gray-400', icon: 'fa-user', label: 'USUÁRIO' };
    }
  };

  const circularUsers = users.filter(u => [UserRole.RESIDENT, UserRole.COLLECTOR, UserRole.POINT].includes(u.role));
  const energyUsers = users.filter(u => [UserRole.PRODUCER, UserRole.CONSUMER].includes(u.role));

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 py-12 overflow-y-auto hide-scrollbar">
      {/* LOGO AREA */}
      <div className="mb-8 text-center animate-fade-in">
        <div className="bg-white text-[#10b981] w-20 h-20 rounded-[2.2rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/10 border border-emerald-50">
          <i className="fas fa-recycle text-4xl"></i>
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">EcoCash</h1>
        <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.3em] mt-1">THE CIRCULAR ECOSYSTEM</p>
      </div>

      <div className="w-full max-w-sm space-y-8">
        
        {/* UNIVERSO CIRCULAR */}
        <section className="bg-white p-3 rounded-[2.8rem] border border-emerald-100 shadow-xl shadow-emerald-500/5">
           <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 mb-2">
              <i className="fas fa-arrows-spin text-emerald-500 text-xs"></i>
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Economia Circular</h2>
           </div>
           <div className="space-y-2">
              {circularUsers.map(u => {
                const style = getRoleStyle(u.role);
                return (
                  <button 
                    key={u.id}
                    onClick={() => onLogin(u)}
                    className="w-full bg-[#f8fafc] p-4 rounded-2xl flex items-center gap-4 group transition-all hover:bg-emerald-50 border border-transparent hover:border-emerald-100 active:scale-[0.98]"
                  >
                    <div className={`w-11 h-11 ${style.color} rounded-xl flex items-center justify-center text-white text-base shadow-md group-hover:scale-105 transition-transform`}>
                      <i className={`fas ${style.icon}`}></i>
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-bold text-slate-800 text-sm leading-none mb-1">{u.name}</h3>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{style.label}</p>
                    </div>
                    <i className="fas fa-chevron-right text-slate-200 text-[10px] pr-2 group-hover:text-emerald-500"></i>
                  </button>
                );
              })}
           </div>
        </section>

        {/* UNIVERSO ENERGY */}
        <section className="bg-white p-3 rounded-[2.8rem] border border-blue-100 shadow-xl shadow-blue-500/5">
           <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 mb-2">
              <i className="fas fa-bolt-lightning text-blue-500 text-xs"></i>
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Energy Cloud</h2>
           </div>
           <div className="space-y-2">
              {energyUsers.map(u => {
                const style = getRoleStyle(u.role);
                return (
                  <button 
                    key={u.id}
                    onClick={() => onLogin(u)}
                    className="w-full bg-[#f8fafc] p-4 rounded-2xl flex items-center gap-4 group transition-all hover:bg-blue-50 border border-transparent hover:border-blue-100 active:scale-[0.98]"
                  >
                    <div className={`w-11 h-11 ${style.color} rounded-xl flex items-center justify-center text-white text-base shadow-md group-hover:scale-105 transition-transform`}>
                      <i className={`fas ${style.icon}`}></i>
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-bold text-slate-800 text-sm leading-none mb-1">{u.name}</h3>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{style.label}</p>
                    </div>
                    <i className="fas fa-chevron-right text-slate-200 text-[10px] pr-2 group-hover:text-blue-500"></i>
                  </button>
                );
              })}
           </div>
        </section>

      </div>

      <div className="mt-12 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-slate-300">
          <i className="fas fa-shield-halved text-[10px]"></i>
          <p className="text-[8px] font-black uppercase tracking-widest">Security Layer Active</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
