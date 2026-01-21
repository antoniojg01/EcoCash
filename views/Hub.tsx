
import React from 'react';
import { User, UserRole } from '../types';
import { cloud } from '../services/cloudService';

interface HubProps {
  user: User;
  onNavigate: (view: 'home' | 'democracy' | 'sos' | 'market' | 'services') => void;
  onSubView: (sub: string) => void;
}

const Hub: React.FC<HubProps> = ({ user, onNavigate, onSubView }) => {
  const analytics = cloud.getMarketAnalytics();
  const services = cloud.getServices();
  const openServicesCount = services.filter(s => s.status === 'OPEN').length;
  const myActiveServices = services.filter(s => (s.requesterId === user.id || s.providerId === user.id) && s.status !== 'COMPLETED').length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* HEADER DE BOAS VINDAS */}
      <section className="px-2">
        <div className="flex items-center gap-2 mb-1">
           <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Sistemas Operacionais Online</p>
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Escolha seu <br/>Campo de Ação</h2>
      </section>

      {/* GRID DE CAMPOS PRINCIPAIS */}
      <div className="space-y-5">
        
        {/* CAMPO 1: ECONOMIA CIRCULAR (VERDE) */}
        <button 
          onClick={() => onNavigate('home')}
          className="w-full bg-white p-7 rounded-[3.5rem] border border-emerald-100 shadow-xl shadow-emerald-500/5 group transition-all active:scale-[0.98] text-left relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-50 rounded-full opacity-40 group-hover:scale-125 transition-transform duration-700"></div>
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center text-2xl shadow-lg shadow-emerald-200 group-hover:rotate-12 transition-transform">
              <i className="fas fa-arrows-spin"></i>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase">Economia Circular</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Venda de Recicláveis & Logística</p>
            </div>
            <div className="bg-emerald-50 w-10 h-10 rounded-full flex items-center justify-center text-emerald-500">
               <i className="fas fa-arrow-right text-xs"></i>
            </div>
          </div>
        </button>

        {/* CAMPO 2: ECOSERV (ÍNDIGO) */}
        <div className="bg-indigo-900 p-8 rounded-[4rem] shadow-2xl shadow-indigo-500/20 space-y-6 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div>
               <div className="flex items-center gap-2 mb-2">
                  <span className="bg-indigo-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase">Campo Ativo</span>
                  {myActiveServices > 0 && (
                    <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase animate-pulse">{myActiveServices} Ordens</span>
                  )}
               </div>
               <h3 className="text-2xl font-black text-white tracking-tighter uppercase">EcoServ</h3>
               <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-1">Serviços On-Demand P2P</p>
            </div>
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/10">
               <i className="fas fa-handshake text-2xl"></i>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 relative z-10">
            <button 
              onClick={() => { onNavigate('services'); onSubView('create'); }}
              className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-[2.2rem] group hover:bg-white transition-all active:scale-95 flex flex-col items-center gap-2"
            >
              <i className="fas fa-plus-circle text-indigo-400 group-hover:text-indigo-600 transition-colors"></i>
              <p className="text-[9px] font-black text-white group-hover:text-indigo-900 uppercase tracking-widest transition-colors">Pedir</p>
            </button>
            <button 
              onClick={() => { onNavigate('services'); onSubView('browse'); }}
              className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-[2.2rem] group hover:bg-white transition-all active:scale-95 flex flex-col items-center gap-2"
            >
              <div className="relative">
                 <i className="fas fa-magnifying-glass text-indigo-400 group-hover:text-indigo-600 transition-colors"></i>
                 {openServicesCount > 0 && (
                   <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                 )}
              </div>
              <p className="text-[9px] font-black text-white group-hover:text-indigo-900 uppercase tracking-widest transition-colors">Mercado</p>
            </button>
          </div>
        </div>

      </div>

      {/* BOTÕES DE AÇÃO RÁPIDA (SECUNDÁRIOS) */}
      <div className="grid grid-cols-2 gap-4 px-1">
         <button 
           onClick={() => onNavigate('democracy')}
           className="bg-slate-100 p-6 rounded-[2.5rem] flex items-center gap-4 group active:scale-95 transition-all border border-slate-200/50"
         >
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm">
               <i className="fas fa-landmark-dome text-sm"></i>
            </div>
            <div className="text-left">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Políticas</p>
               <p className="text-[10px] font-black text-slate-700 uppercase">Votar Causas</p>
            </div>
         </button>
         <button 
           onClick={() => onNavigate('sos')}
           className="bg-red-50 p-6 rounded-[2.5rem] flex items-center gap-4 group active:scale-95 transition-all border border-red-100"
         >
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm">
               <i className="fas fa-triangle-exclamation text-sm"></i>
            </div>
            <div className="text-left">
               <p className="text-[8px] font-black text-red-300 uppercase tracking-widest">Segurança</p>
               <p className="text-[10px] font-black text-red-600 uppercase">SOS Alertas</p>
            </div>
         </button>
      </div>

      {/* FOOTER DO HUB */}
      <div className="pt-4 text-center">
         <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">EcoCash Ecosystem v2.2</p>
      </div>
    </div>
  );
};

export default Hub;
