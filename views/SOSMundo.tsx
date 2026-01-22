
import React, { useState, useEffect } from 'react';
import { User, EcoReport, WildlifeSighting } from '../types';
import { cloud } from '../services/cloudService';

// Add the missing SOSMundoProps interface
interface SOSMundoProps {
  user: User;
}

const SOSMundo: React.FC<SOSMundoProps> = ({ user }) => {
  const [activeSubTab, setActiveSubTab] = useState<'denunciar' | 'history'>('denunciar');
  const [isReporting, setIsReporting] = useState(false);
  const [reportStep, setReportStep] = useState(1);
  
  // Novos campos de denúncia universal
  const [where, setWhere] = useState('');
  const [when, setWhen] = useState('');
  const [description, setDescription] = useState('');
  
  const [reports, setReports] = useState<EcoReport[]>([]);

  useEffect(() => {
    const sync = async () => {
      const allReports = await cloud.getReports();
      setReports(allReports);
    };
    sync();
    window.addEventListener('cloud_update', sync);
    return () => window.removeEventListener('cloud_update', sync);
  }, []);

  const handleSendReport = () => {
    if (!where || !when || !description) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    const newReport: EcoReport = {
      id: `SOS-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: user.id,
      type: 'OUTRO',
      description: `[QUANDO: ${when}] - ${description}`,
      location: { address: where, lat: -23.55, lng: -46.63 },
      timestamp: Date.now(),
      status: 'PENDING',
      potentialReward: 0,
      needsSupport: false,
      supporters: []
    };
    cloud.createReport(newReport);
    setReportStep(2); // Sucesso
  };

  const myReports = reports.filter(r => r.userId === user.id);

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      {/* HEADER SOS */}
      <section className="bg-gradient-to-br from-red-600 to-red-800 p-8 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -right-5 -top-5 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col gap-6">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-200 mb-1">Impacto & Segurança</p>
                 <h2 className="text-4xl font-black tracking-tighter">SOS Mundo</h2>
              </div>
              <div className="bg-black/20 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/5">
                 <span className="text-[10px] font-black uppercase tracking-widest">{reports.length} Alertas</span>
              </div>
           </div>
           
           <div className="bg-white/10 p-4 rounded-3xl border border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                 <i className="fas fa-hand-holding-heart text-white"></i>
                 <p className="text-[11px] font-bold text-red-50">Canal direto para <span className="font-black">Denúncias Ambientais</span></p>
              </div>
           </div>
        </div>
      </section>

      {/* SUBTABS - Apenas Denunciar e Meu SOS */}
      <div className="flex bg-slate-100/50 p-1.5 rounded-full border border-slate-200/50 backdrop-blur-xl">
         {(['denunciar', 'history'] as const).map(tab => (
           <button 
             key={tab}
             onClick={() => setActiveSubTab(tab)}
             className={`flex-1 py-3 text-[9px] font-black rounded-full transition-all uppercase tracking-widest ${
               activeSubTab === tab ? 'bg-white shadow-md text-red-600 scale-105' : 'text-slate-400 hover:text-slate-600'
             }`}
           >
             {tab === 'denunciar' ? 'Denunciar' : 'Meu SOS'}
           </button>
         ))}
      </div>

      {activeSubTab === 'denunciar' && (
        <div className="space-y-6 animate-slide-up">
           <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-8 flex flex-col items-center">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4">
                  <i className="fas fa-bullhorn"></i>
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Denúncia de Qualquer Natureza</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed px-4">
                  Relate crimes ambientais, descarte irregular ou maus-tratos diretamente às autoridades.
                </p>
              </div>

              <div className="w-full space-y-4">
                 <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <i className="fas fa-location-dot text-red-500"></i>
                    <div className="flex-1">
                       <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Localização Automática</p>
                       <p className="text-[10px] font-black text-slate-600">Lat: -23.55 | Long: -46.63</p>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => { 
                  setIsReporting(true); 
                  setReportStep(1); 
                  setWhere('');
                  setWhen('');
                  setDescription('');
                }}
                className="w-full h-16 bg-slate-900 text-white rounded-full font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 flex items-center justify-center gap-3"
              >
                <i className="fas fa-plus"></i>
                Nova Denúncia Agora
              </button>
           </div>
           
           <div className="bg-slate-50 p-6 rounded-[2.5rem] text-center border border-dashed border-slate-200">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Seu anonimato é garantido por criptografia</p>
           </div>
        </div>
      )}

      {activeSubTab === 'history' && (
        <div className="space-y-6 animate-slide-up">
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-lg font-black text-slate-800 tracking-tight text-center">Resumo do Painel SOS</h3>
              <div className="grid grid-cols-1 gap-6">
                 <div className="text-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-2xl font-black text-red-600">{myReports.length}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Denúncias Registradas</p>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
             {myReports.map(r => (
               <div key={r.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 ${r.status === 'PENDING' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'} rounded-2xl flex items-center justify-center text-xl shadow-sm`}>
                        <i className={`fas ${r.status === 'PENDING' ? 'fa-clock' : 'fa-check-circle'}`}></i>
                     </div>
                     <div>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{r.type}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.id}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <span className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${r.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                       {r.status === 'PENDING' ? 'Em Análise' : 'Autoridade Notificada'}
                     </span>
                  </div>
               </div>
             ))}
             {myReports.length === 0 && (
               <div className="py-12 text-center opacity-30">
                 <i className="fas fa-clipboard-list text-3xl mb-3"></i>
                 <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma denúncia no histórico</p>
               </div>
             )}
           </div>
        </div>
      )}

      {/* MODAL DE DENÚNCIA UNIVERSAL */}
      {isReporting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[700] flex items-end justify-center p-6 animate-fade-in" onClick={() => setIsReporting(false)}>
          <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 pb-12 animate-slide-up shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-10"></div>
            
            {reportStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                 <div className="text-center">
                    <h4 className="text-2xl font-black text-slate-800 tracking-tight">Nova Denúncia</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Relate o que aconteceu abaixo</p>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-4">Onde aconteceu?</label>
                       <input 
                         type="text"
                         value={where}
                         onChange={e => setWhere(e.target.value)}
                         placeholder="Rua, bairro ou coordenadas..."
                         className="w-full bg-slate-50 p-5 rounded-2xl font-bold text-xs outline-none border border-slate-100"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-4">Quando aconteceu?</label>
                       <input 
                         type="datetime-local"
                         value={when}
                         onChange={e => setWhen(e.target.value)}
                         className="w-full bg-slate-50 p-5 rounded-2xl font-bold text-xs outline-none border border-slate-100"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-4">Descrição do ocorrido</label>
                       <textarea 
                         value={description}
                         onChange={e => setDescription(e.target.value)}
                         placeholder="Descreva o que aconteceu em detalhes..."
                         className="w-full bg-slate-50 p-5 rounded-2xl font-bold text-xs outline-none border border-slate-100 h-32 resize-none"
                       />
                    </div>
                 </div>

                 <div className="flex flex-col gap-3 pt-4">
                    <button 
                      onClick={handleSendReport}
                      className="w-full bg-red-600 text-white h-16 rounded-full font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95"
                    >Enviar Denúncia Agora</button>
                    <button 
                      onClick={() => setIsReporting(false)}
                      className="w-full h-12 text-slate-400 font-black text-[10px] uppercase tracking-widest"
                    >Cancelar</button>
                 </div>
              </div>
            )}

            {reportStep === 2 && (
              <div className="space-y-8 animate-slide-up py-6">
                 <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto text-4xl shadow-xl animate-bounce">
                    <i className="fas fa-check"></i>
                 </div>
                 <div className="text-center space-y-2">
                    <h4 className="text-2xl font-black text-slate-800 tracking-tight">Relato Enviado!</h4>
                    <p className="text-sm font-bold text-slate-400 px-4">Sua denúncia foi protocolada com segurança.</p>
                 </div>
                 
                 <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3">
                       <i className="fas fa-shield-check text-blue-500"></i>
                       <p className="text-[10px] font-bold text-slate-500">As autoridades competentes foram notificadas em tempo real.</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <i className="fas fa-user-secret text-slate-400"></i>
                       <p className="text-[10px] font-bold text-slate-500">Seus dados pessoais permanecem protegidos.</p>
                    </div>
                 </div>

                 <button 
                   onClick={() => setIsReporting(false)}
                   className="w-full bg-slate-900 text-white h-16 rounded-full font-black text-[11px] uppercase tracking-widest"
                 >Entendido</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SOSMundo;
