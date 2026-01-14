import React from 'react';
import { cloud } from '../services/cloudService';

const PlatformMetrics: React.FC = () => {
  const analytics = cloud.getMarketAnalytics();
  const users = cloud.getUsers();
  
  // Agregando dados globais
  const totalRecycled = users.reduce((acc, u) => acc + u.totalRecycledKg, 0);
  const totalBalance = users.reduce((acc, u) => acc + u.balance, 0);
  const co2Avoided = totalRecycled * 1.5; // Estimativa: 1.5kg CO2 por kg de plástico

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      {/* GLOBAL IMPACT HEADER */}
      <section className="bg-slate-900 p-10 rounded-[3.5rem] text-white space-y-8 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="text-center space-y-1 relative z-10">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Impacto Global Consolidado</p>
          <h2 className="text-4xl font-black tracking-tighter">EcoSystem Status</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 relative z-10">
           <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10">
              <i className="fas fa-leaf text-emerald-400 text-lg mb-3"></i>
              <p className="text-xl font-black text-white">{totalRecycled.toFixed(1)}t</p>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Resíduos Processados</p>
           </div>
           <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10">
              <i className="fas fa-cloud-arrow-down text-blue-400 text-lg mb-3"></i>
              <p className="text-xl font-black text-white">{co2Avoided.toFixed(1)}t</p>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">CO2 Mitigado</p>
           </div>
        </div>
      </section>

      {/* MARKET TRENDS */}
      <section className="space-y-6 px-2">
        <div className="flex justify-between items-end px-4">
           <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Tendências de Mercado</h3>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Preço Médio por Região</p>
           </div>
           <i className="fas fa-chart-line text-blue-500"></i>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
           {analytics.regionStats.map((region, i) => (
             <div key={i} className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                   <span className="text-slate-400">{region.region}</span>
                   <span className="text-slate-700 font-black">R$ {region.avgPrice.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                     style={{ width: `${(region.avgPrice / 0.30) * 100}%` }}
                   ></div>
                </div>
             </div>
           ))}
        </div>
      </section>

      {/* SMART OPPORTUNITY */}
      <section className="bg-blue-50/50 p-10 rounded-[3.5rem] border border-blue-100 space-y-6">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-500 text-xl">
               <i className="fas fa-bolt-lightning"></i>
            </div>
            <div>
               <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Janela de Eficiência</h4>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Melhor hora para compra</p>
            </div>
         </div>
         
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-blue-100/50">
               <p className="text-[14px] font-black text-slate-800">11:00 — 14:00</p>
               <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-1">Alta Oferta Solar</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-blue-100/50">
               <p className="text-[14px] font-black text-emerald-500">R$ 0,22</p>
               <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Preço Mínimo / kWh</p>
            </div>
         </div>

         <p className="text-[9px] text-center text-slate-400 font-bold leading-relaxed px-4 italic">
           "Aproveite o pico de geração fotovoltaica para garantir os melhores spreads do marketplace P2P."
         </p>
      </section>

      {/* NETWORK STATUS */}
      <section className="px-2">
         <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nós Ativos na Rede</p>
            </div>
            <p className="text-lg font-black text-slate-800">{users.length * 142} <span className="text-[10px] text-slate-300">UCs</span></p>
         </div>
      </section>
    </div>
  );
};

export default PlatformMetrics;