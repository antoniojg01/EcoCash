
import React, { useState, useEffect } from 'react';
import { User, EcoReport, WildlifeSighting } from '../types';
import { cloud } from '../services/cloudService';

interface SOSMundoProps {
  user: User;
}

const OFFICIAL_REWARDS = [
  { 
    id: 'r1', 
    title: 'Caça Ilegal de Baleias', 
    authority: 'NOAA / Interpol', 
    reward: 'US$ 20.000', 
    icon: 'fa-whale', 
    needs: 'Foto/Vídeo + Localização',
    description: 'Flagrante de embarcações em activity de caça ou assédio.' 
  },
  { 
    id: 'r2', 
    title: 'Tráfico de Animais', 
    authority: 'IBAMA / Polícia Federal', 
    reward: 'Até R$ 100.000', 
    icon: 'fa-dove', 
    needs: 'Evidência de Captura/Venda',
    description: 'Comércio ilegal de fauna silvestre em feiras ou ambiente digital.' 
  },
  { 
    id: 'r3', 
    title: 'Desmatamento em APP', 
    authority: 'IBAMA', 
    reward: '10% da Multa', 
    icon: 'fa-tree', 
    needs: 'Coordenadas + Máquinas Ativas',
    description: 'Supressão de vegetação nativa em áreas de preservação permanente.' 
  },
  { 
    id: 'r4', 
    title: 'Crime Ambiental Federal', 
    authority: 'Disque-Denúncia', 
    reward: 'R$ 500 — 50k', 
    icon: 'fa-triangle-exclamation', 
    needs: 'Qualquer evidência relevante',
    description: 'Queimadas, poluição de rios ou descarte de lixo tóxico.' 
  },
];

const SOSMundo: React.FC<SOSMundoProps> = ({ user }) => {
  const [activeSubTab, setActiveSubTab] = useState<'rewards' | 'support' | 'tracker' | 'history'>('rewards');
  const [isReporting, setIsReporting] = useState(false);
  const [reportStep, setReportStep] = useState(1);
  const [reportType, setReportType] = useState<any>('DESMATAMENTO');
  const [description, setDescription] = useState('');
  
  const [sightings, setSightings] = useState<WildlifeSighting[]>([]);
  const [reports, setReports] = useState<EcoReport[]>([]);
  const analytics = cloud.getMarketAnalytics();

  // Fix: Handling async cloud methods correctly
  useEffect(() => {
    const sync = async () => {
      const allSightings = await cloud.getSightings();
      const allReports = await cloud.getReports();
      setSightings(allSightings);
      setReports(allReports);
    };
    sync();
    window.addEventListener('cloud_update', sync);
    return () => window.removeEventListener('cloud_update', sync);
  }, []);

  const handleSendReport = () => {
    const newReport: EcoReport = {
      id: `SOS-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: user.id,
      type: reportType,
      description,
      location: { address: 'Localização GPS Capturada', lat: -23.55, lng: -46.63 },
      timestamp: Date.now(),
      status: 'PENDING',
      potentialReward: 5000,
      needsSupport: true,
      supporters: []
    };
    cloud.createReport(newReport);
    setReportStep(3); // Sucesso
  };

  const handleAddSighting = () => {
    const species = prompt('O que você avistou? (Ex: Baleia Jubarte, Arara Azul)');
    if (!species) return;
    const newSighting: WildlifeSighting = {
      id: `WIT-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: user.id,
      species,
      location: { address: 'Ponto Costeiro Delta 4', lat: -27.1, lng: -48.2 },
      timestamp: Date.now()
    };
    cloud.createSighting(newSighting);
    alert('Avistamento registrado! Sua contribuição gerou R$ ' + (Math.random()*5+2).toFixed(2) + ' via Whale Tracker Pro.');
  };

  const handleSupportReport = (reportId: string) => {
    if (cloud.addEvidenceToReport(user.id, reportId)) {
      alert('Sua evidência adicional foi anexada ao caso. Você receberá 30% da recompensa caso a denúncia prospere!');
    }
  };

  const myReports = reports.filter(r => r.userId === user.id);
  const othersReportsNeedSupport = reports.filter(r => r.userId !== user.id && r.needsSupport);

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      {/* HEADER SOS REFRESH */}
      <section className="bg-gradient-to-br from-red-600 to-red-800 p-8 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -right-5 -top-5 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col gap-6">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-200 mb-1">Impacto & Segurança</p>
                 <h2 className="text-4xl font-black tracking-tighter">SOS Mundo</h2>
              </div>
              <div className="bg-black/20 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/5">
                 <span className="text-[10px] font-black uppercase tracking-widest">{analytics.totalReports} Ativos</span>
              </div>
           </div>
           
           <div className="bg-white/10 p-4 rounded-3xl border border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                 <i className="fas fa-hand-holding-dollar text-emerald-400"></i>
                 <p className="text-[11px] font-bold text-red-50">Você tem <span className="font-black">R$ {(user.totalSightingRevenue || 0).toFixed(2)}</span> acumulados via Whale Tracker</p>
              </div>
           </div>
        </div>
      </section>

      {/* SUBTABS REFINED */}
      <div className="flex bg-slate-100/50 p-1.5 rounded-full border border-slate-200/50 backdrop-blur-xl">
         {(['rewards', 'support', 'tracker', 'history'] as const).map(tab => (
           <button 
             key={tab}
             onClick={() => setActiveSubTab(tab)}
             className={`flex-1 py-3 text-[9px] font-black rounded-full transition-all uppercase tracking-widest ${
               activeSubTab === tab ? 'bg-white shadow-md text-red-600 scale-105' : 'text-slate-400 hover:text-slate-600'
             }`}
           >
             {tab === 'rewards' ? 'Ganhos' : tab === 'support' ? 'Ajuda' : tab === 'tracker' ? 'Fauna' : 'Meu SOS'}
           </button>
         ))}
      </div>

      {/* Fix: Replaced undefined activeTab with correct activeSubTab */}
      {activeSubTab === 'rewards' && (
        <div className="space-y-6 animate-slide-up">
           <div className="px-4 flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Recompensas Oficiais</h3>
              <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-2 py-1 rounded-lg">VERIFICADAS</span>
           </div>
           
           <div className="space-y-4">
             {OFFICIAL_REWARDS.map(r => (
               <div key={r.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-6 group hover:border-red-200 transition-all">
                  <div className="flex justify-between items-start">
                     <div className="flex gap-5">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                           <i className={`fas ${r.icon}`}></i>
                        </div>
                        <div>
                           <h4 className="text-base font-black text-slate-800 tracking-tight leading-tight">{r.title}</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{r.authority}</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="bg-slate-50 p-5 rounded-3xl flex items-center justify-between border border-slate-100">
                     <div className="text-left">
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Valor da Recompensa</p>
                        <p className="text-xl font-black text-emerald-600">{r.reward}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Requisito</p>
                        <p className="text-[10px] font-black text-slate-600">{r.needs.split('+')[0]}</p>
                     </div>
                  </div>

                  <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">"{r.description}"</p>
                  
                  <button 
                    onClick={() => { setIsReporting(true); setReportStep(1); setReportType(r.title.includes('Desmatamento') ? 'DESMATAMENTO' : 'CAÇA'); }}
                    className="w-full h-16 bg-slate-900 text-white rounded-full font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 flex items-center justify-center gap-3"
                  >
                    <i className="fas fa-camera"></i>
                    Denunciar Agora
                  </button>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* Fix: Replaced undefined activeTab with correct activeSubTab */}
      {activeSubTab === 'support' && (
        <div className="space-y-6 animate-slide-up">
           <div className="bg-amber-600 p-8 rounded-[3rem] text-white shadow-xl space-y-3">
              <h3 className="text-xl font-black tracking-tight">Ganhe 30% Ajudando</h3>
              <p className="text-[10px] font-bold text-amber-100 leading-relaxed">
                Estes casos já foram abertos por outros usuários mas precisam de evidências adicionais (mais fotos, vídeos atuais) para validação pelas autoridades.
              </p>
           </div>

           <div className="space-y-4 px-1">
              {othersReportsNeedSupport.map(r => (
                <div key={r.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                   <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                         <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-xl">
                            <i className="fas fa-search-location"></i>
                         </div>
                         <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase">{r.type}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocolo: {r.id}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-base font-black text-emerald-500">R$ {(r.potentialReward * 0.3).toFixed(2)}</p>
                         <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Sua Parte</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-3 text-slate-500">
                      <i className="fas fa-location-dot text-red-500 text-xs"></i>
                      <p className="text-[10px] font-black uppercase tracking-widest">{r.location.address}</p>
                   </div>

                   <button 
                     onClick={() => handleSupportReport(r.id)}
                     className="w-full h-14 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95"
                   >
                     Ir até lá / Adicionar Provas
                   </button>
                </div>
              ))}
              {othersReportsNeedSupport.length === 0 && (
                <div className="py-20 text-center opacity-30">
                  <i className="fas fa-satellite-dish text-4xl mb-4"></i>
                  <p className="text-[10px] font-black uppercase tracking-widest">Nenhum caso próximo precisando de ajuda</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Fix: Replaced undefined activeTab with correct activeSubTab */}
      {activeSubTab === 'tracker' && (
        <div className="space-y-8 animate-slide-up">
           <div className="bg-blue-600 p-10 rounded-[3.5rem] text-white space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
              <div className="flex justify-between items-start relative z-10">
                 <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center text-3xl">
                    <i className="fas fa-whale"></i>
                 </div>
                 <div className="text-right">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Whale Tracker Pro</span>
                 </div>
              </div>
              
              <div className="space-y-1 relative z-10">
                 <h3 className="text-2xl font-black tracking-tight">Aviste Fauna, Ganhe Dinheiro</h3>
                 <p className="text-[11px] font-bold text-blue-100 leading-relaxed">
                   Seus registros alimentam o dashboard de operadoras de turismo sustentável. 60% da receita de assinaturas é dividida com os observadores.
                 </p>
              </div>

              <div className="bg-black/20 p-5 rounded-3xl border border-white/5 flex justify-between items-center relative z-10">
                 <div>
                    <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest mb-1">Total Compartilhado</p>
                    <p className="text-2xl font-black text-white">R$ {analytics.totalSightingRevenueDist.toFixed(2)}</p>
                 </div>
                 <i className="fas fa-chart-line text-blue-200 opacity-40 text-4xl"></i>
              </div>

              <button 
                onClick={handleAddSighting}
                className="w-full bg-white text-blue-600 h-16 rounded-full font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 relative z-10"
              >
                Registrar Avistamento (+50 pts)
              </button>
           </div>

           <div className="space-y-4 px-2">
              <div className="flex justify-between items-center px-2">
                 <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Hotspots Recentes</h4>
                 <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Tempo Real</span>
              </div>
              {sightings.slice().reverse().map(s => (
                <div key={s.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-50 flex items-center justify-between shadow-sm group hover:shadow-md transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        <i className="fas fa-eye"></i>
                      </div>
                      <div>
                         <p className="text-sm font-black text-slate-800">{s.species}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.location.address}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-blue-500 uppercase">+R$ {(s.revenueEarned || 0).toFixed(2)}</p>
                      <p className="text-[9px] font-black text-slate-300 uppercase mt-1">Geração de Dados</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Fix: Replaced undefined activeTab with correct activeSubTab */}
      {activeSubTab === 'history' && (
        <div className="space-y-6 animate-slide-up">
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-lg font-black text-slate-800 tracking-tight text-center">Resumo do Painel SOS</h3>
              <div className="grid grid-cols-2 gap-6">
                 <div className="text-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-2xl font-black text-red-600">{myReports.length}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Denúncias</p>
                 </div>
                 <div className="text-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-2xl font-black text-blue-600">{sightings.filter(s => s.userId === user.id).length}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Avistamentos</p>
                 </div>
              </div>
              <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Ganhos em Recompensas</p>
                    <p className="text-2xl font-black text-emerald-700">R$ {user.balance.toFixed(2)}</p>
                 </div>
                 <i className="fas fa-money-bill-transfer text-emerald-300 text-3xl"></i>
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
           </div>
        </div>
      )}

      {/* MODAL DE DENÚNCIA MULTI-STEP */}
      {isReporting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[700] flex items-end justify-center p-6 animate-fade-in" onClick={() => setIsReporting(false)}>
          <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 pb-12 animate-slide-up shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-10"></div>
            
            {reportStep === 1 && (
              <div className="space-y-8 animate-fade-in">
                 <div className="text-center">
                    <h4 className="text-2xl font-black text-slate-800 tracking-tight">Captura de Prova</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Passo 1 de 2</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <button className="aspect-square bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all text-slate-400 hover:text-red-500 hover:border-red-200">
                       <i className="fas fa-camera text-2xl"></i>
                       <span className="text-[10px] font-black uppercase tracking-widest">Foto</span>
                    </button>
                    <button className="aspect-square bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all text-slate-400 hover:text-red-500 hover:border-red-200">
                       <i className="fas fa-video text-2xl"></i>
                       <span className="text-[10px] font-black uppercase tracking-widest">Vídeo</span>
                    </button>
                 </div>

                 <div className="bg-red-50 p-6 rounded-3xl flex items-center gap-4 border border-red-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm">
                       <i className="fas fa-location-crosshairs"></i>
                    </div>
                    <div className="text-left">
                       <p className="text-[8px] font-black text-red-300 uppercase tracking-widest">Localização Automática</p>
                       <p className="text-[10px] font-black text-red-600">Lat: -23.55 | Long: -46.63</p>
                    </div>
                 </div>

                 <button 
                   onClick={() => setReportStep(2)}
                   className="w-full bg-slate-900 text-white h-16 rounded-full font-black text-[11px] uppercase tracking-widest shadow-xl"
                 >Próximo</button>
              </div>
            )}

            {reportStep === 2 && (
              <div className="space-y-8 animate-fade-in">
                 <div className="text-center">
                    <h4 className="text-2xl font-black text-slate-800 tracking-tight">Detalhes Finais</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Passo 2 de 2</p>
                 </div>

                 <div className="space-y-5">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-4">Tipo de Crime</label>
                       <select 
                         value={reportType}
                         onChange={e => setReportType(e.target.value)}
                         className="w-full bg-slate-50 p-5 rounded-2xl font-black text-xs outline-none border border-slate-100"
                       >
                         <option value="DESMATAMENTO">Desmatamento Ilegal</option>
                         <option value="CAÇA">Caça / Pesca Predatória</option>
                         <option value="TRÁFICO">Tráfico de Animais</option>
                         <option value="INCÊNDIO">Queimada Irregular</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-4">Descrição curta (opcional)</label>
                       <textarea 
                         value={description}
                         onChange={e => setDescription(e.target.value)}
                         placeholder="Ex: Placa do barco, número de envolvidos..."
                         className="w-full bg-slate-50 p-5 rounded-2xl font-bold text-xs outline-none border border-slate-100 h-28 resize-none"
                       />
                    </div>
                 </div>

                 <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleSendReport}
                      className="w-full bg-red-600 text-white h-16 rounded-full font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95"
                    >Enviar Denúncia Oficial</button>
                    <button 
                      onClick={() => setReportStep(1)}
                      className="w-full h-12 text-slate-400 font-black text-[10px] uppercase tracking-widest"
                    >Voltar</button>
                 </div>
              </div>
            )}

            {reportStep === 3 && (
              <div className="space-y-8 animate-slide-up py-6">
                 <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto text-4xl shadow-xl animate-bounce">
                    <i className="fas fa-check"></i>
                 </div>
                 <div className="text-center space-y-2">
                    <h4 className="text-2xl font-black text-slate-800 tracking-tight">Denúncia Registrada!</h4>
                    <p className="text-sm font-bold text-slate-400 px-4">Protocolo: #BR-2026-{Math.floor(Math.random()*9999)}</p>
                 </div>
                 
                 <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3">
                       <i className="fas fa-envelope-circle-check text-blue-500"></i>
                       <p className="text-[10px] font-bold text-slate-500">Enviado automaticamente para <span className="text-slate-800">IBAMA</span> e <span className="text-slate-800">Polícia Federal</span>.</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <i className="fas fa-bell text-amber-500"></i>
                       <p className="text-[10px] font-bold text-slate-500">Te avisaremos sobre multas e recompensas.</p>
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
