
import React from 'react';
import { User } from '../types';
import { cloud } from '../services/cloudService';

interface AnalyticsDashboardProps {
  user: User;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ user }) => {
  const analytics = cloud.getMarketAnalytics();

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      {/* STATUS DE PARCEIRO */}
      <section className="bg-[#0f172a] p-10 rounded-[3.5rem] text-white space-y-2 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Enterprise Partner Account</p>
        <h2 className="text-3xl font-black tracking-tighter">Market Intelligence</h2>
        <div className="pt-6 flex flex-wrap gap-4">
           <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700 flex-1 min-w-[120px]">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Treasury (Plataforma)</p>
              <p className="text-xl font-black text-emerald-400">R$ {analytics.treasury.toFixed(2)}</p>
           </div>
           <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700 flex-1 min-w-[120px]">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Matching Realizado</p>
              <p className="text-xl font-black text-white">{analytics.totalTransactions}</p>
           </div>
        </div>
      </section>

      {/* HEATMAP REGIONAL (SIMULADO) */}
      <section className="space-y-4 px-2">
         <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">Demanda e Preço por Região</h3>
         <div className="grid grid-cols-1 gap-4">
            {analytics.regionStats.map((stat, i) => (
               <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black">
                        {stat.region.substring(0, 2).toUpperCase()}
                     </div>
                     <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{stat.region}</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stat.count} Transações</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-base font-black text-slate-700">R$ {stat.avgPrice.toFixed(2)}/kWh</p>
                     <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${Math.min((stat.totalKwh / 1000) * 100, 100)}%` }}
                        ></div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* MELHOR HORA PARA COMPRAR */}
      <section className="bg-slate-900 p-10 rounded-[3.5rem] text-white space-y-8">
         <div className="flex justify-between items-center">
            <h3 className="text-lg font-black tracking-tight">Oportunidade de Mercado</h3>
            <span className="text-[9px] font-black text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full uppercase">Smart Window</span>
         </div>
         
         <div className="bg-slate-800/50 p-6 rounded-[2rem] border border-slate-800 flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-500 text-white rounded-[1.5rem] flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
               <i className="fas fa-clock"></i>
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Melhor hora para compra</p>
               <p className="text-xl font-black text-white">11:00 — 14:00</p>
               <p className="text-[9px] font-bold text-blue-300 uppercase mt-1">Excesso de Oferta Solar (Matching 98%)</p>
            </div>
         </div>

         <div className="pt-4">
            <button className="w-full bg-blue-600 h-16 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
               <i className="fas fa-file-export"></i>
               Exportar Relatório Mensal (PDF/CSV)
            </button>
         </div>
      </section>

      {/* TRENDS PARA INSTALADORES */}
      <section className="px-2 space-y-4">
         <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">Insights para Instaladores</h3>
         <div className="bg-white p-8 rounded-[3rem] border border-slate-100 space-y-6 shadow-sm">
            <div className="flex items-start gap-4">
               <i className="fas fa-location-crosshairs text-blue-500 mt-1"></i>
               <div>
                  <p className="text-sm font-black text-slate-700 tracking-tight">Zona de Alta Demanda</p>
                  <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                     A região <span className="text-blue-500 font-black">Sudeste</span> apresenta o maior gap entre produtores e consumidores. Recomendado expansão de usinas nesta área.
                  </p>
               </div>
            </div>
            <div className="h-[1px] bg-slate-50 w-full"></div>
            <div className="flex items-start gap-4">
               <i className="fas fa-tag text-emerald-500 mt-1"></i>
               <div>
                  <p className="text-sm font-black text-slate-700 tracking-tight">Ticket Médio P2P</p>
                  <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                     O valor médio por transação aumentou <span className="text-emerald-500 font-black">+12%</span> este mês, indicando maturação do mercado secundário.
                  </p>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
};

export default AnalyticsDashboard;
