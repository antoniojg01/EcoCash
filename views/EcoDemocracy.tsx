
import React, { useState, useEffect } from 'react';
import { User, EcoCause } from '../types';
import { cloud } from '../services/cloudService';

interface EcoDemocracyProps {
  user: User;
}

const EcoDemocracy: React.FC<EcoDemocracyProps> = ({ user }) => {
  const [causes, setCauses] = useState<EcoCause[]>([]);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [selectedCause, setSelectedCause] = useState<EcoCause | null>(null);
  const [voteAmount, setVoteAmount] = useState('50');

  useEffect(() => {
    setCauses(cloud.getCauses());
    const handleSync = () => setCauses(cloud.getCauses());
    window.addEventListener('cloud_update', handleSync);
    return () => window.removeEventListener('cloud_update', handleSync);
  }, []);

  const handleWatchAd = () => {
    setIsAdLoading(true);
    setTimeout(() => {
      cloud.earnPoints(user.id, 20, 'Publicidade');
      setIsAdLoading(false);
      alert('Parabéns! Você ganhou 20 EcoPoints.');
    }, 3000);
  };

  const handleVote = () => {
    if (!selectedCause) return;
    const amount = parseInt(voteAmount);
    if (cloud.voteForCause(user.id, selectedCause.id, amount)) {
      alert(`Você alocou ${amount} pontos para ${selectedCause.title}!`);
      setSelectedCause(null);
    } else {
      alert('Pontos insuficientes!');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* HEADER DE PONTOS */}
      <section className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Sua Moeda de Voto</p>
            <h2 className="text-4xl font-black tracking-tighter">
              <i className="fas fa-coins mr-2 text-amber-400"></i>
              {user.points} <span className="text-sm font-bold text-slate-400">EcoPoints</span>
            </h2>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Poder Social</p>
             <p className="text-xl font-black">Lv. {Math.floor(user.points / 500) + 1}</p>
          </div>
        </div>
      </section>

      {/* GANHAR PONTOS */}
      <div className="grid grid-cols-2 gap-4 px-2">
        <button 
          onClick={handleWatchAd}
          disabled={isAdLoading}
          className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-all"
        >
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
            {isAdLoading ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-play text-sm"></i>}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Eco-Ads</span>
          <span className="text-[11px] font-bold text-emerald-600">+20 pts</span>
        </button>
        <button 
          onClick={() => {
            const val = prompt('Quanto deseja investir em pontos? (R$ 1 = 100 pts)', '5');
            if(val) cloud.buyPoints(user.id, parseFloat(val));
          }}
          className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-all"
        >
          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
            <i className="fas fa-credit-card text-sm"></i>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Comprar</span>
          <span className="text-[11px] font-bold text-blue-600">Pacotes</span>
        </button>
      </div>

      {/* LISTA DE CAUSAS */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-4">
           <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">Causas em Votação</h3>
           <i className="fas fa-filter text-slate-300 text-xs"></i>
        </div>

        <div className="space-y-4">
          {causes.map(cause => {
            const progress = (cause.jackpotPoints / cause.targetPoints) * 100;
            return (
              <div key={cause.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 group hover:border-emerald-200 transition-all">
                <div className="flex justify-between items-start">
                   <div className="flex gap-4">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-emerald-500 text-2xl group-hover:scale-110 transition-transform">
                        <i className={`fas ${cause.icon}`}></i>
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-800 tracking-tight uppercase">{cause.title}</h4>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">{cause.category} • {cause.votersCount} Votos</p>
                      </div>
                   </div>
                </div>
                
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">"{cause.description}"</p>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Jackpot Atual</p>
                      <p className="text-xl font-black text-slate-800">R$ {(cause.jackpotPoints / 100).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-emerald-500">{progress.toFixed(0)}% Meta</p>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedCause(cause)}
                  className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  Apoiar com meus Pontos
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* MODAL DE VOTAÇÃO */}
      {selectedCause && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[500] flex items-end justify-center p-6 animate-fade-in" onClick={() => setSelectedCause(null)}>
          <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-8"></div>
            <h4 className="text-xl font-black text-slate-800 text-center mb-6 tracking-tight">Quanto quer alocar?</h4>
            
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col items-center mb-8">
              <input 
                type="number" 
                value={voteAmount}
                onChange={e => setVoteAmount(e.target.value)}
                className="bg-transparent text-5xl font-black text-slate-800 outline-none w-full text-center"
              />
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-4">Equivale a R$ {(parseInt(voteAmount) / 100).toFixed(2)}</p>
            </div>

            <div className="flex flex-col gap-3">
               <button 
                 onClick={handleVote}
                 className="w-full bg-emerald-600 text-white h-16 rounded-full font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
               >
                 Confirmar Voto Líquido
               </button>
               <button 
                 onClick={() => setSelectedCause(null)}
                 className="w-full h-14 text-slate-400 font-black text-[10px] uppercase tracking-widest"
               >
                 Cancelar
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcoDemocracy;
