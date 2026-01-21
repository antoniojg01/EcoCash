
import React, { useState, useEffect } from 'react';
import { User, EcoService } from '../types';
import { cloud } from '../services/cloudService';
import { estimateServicePrice } from '../services/geminiService';

interface EcoServicesProps {
  user: User;
  initialTab?: 'browse' | 'my-orders' | 'create';
}

const EcoServices: React.FC<EcoServicesProps> = ({ user, initialTab = 'browse' }) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'my-orders' | 'create'>(initialTab);
  const [services, setServices] = useState<EcoService[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Create state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('REPAROS');
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [customPrice, setCustomPrice] = useState<string>('');
  
  // Negotiation state
  const [negotiatingId, setNegotiatingId] = useState<string | null>(null);
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [counterOffer, setCounterOffer] = useState<string>('');
  const [customScope, setCustomScope] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Payment & Scheduling UI state
  const [showPix, setShowPix] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const [scheduleData, setScheduleData] = useState({ date: '', time: '', location: '', isRemote: false });

  const currentService = services.find(s => s.id === activeServiceId);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const sync = () => setServices(cloud.getServices());
    sync();
    window.addEventListener('cloud_update', sync);
    return () => window.removeEventListener('cloud_update', sync);
  }, []);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleFetchAiPrice = async () => {
    if (!newDesc || !newCategory) return;
    setIsProcessing(true);
    const suggestion = await estimateServicePrice(newCategory, newDesc, user.region);
    setAiSuggestion(suggestion);
    setCustomPrice(suggestion.suggestedPrice.toString());
    setIsProcessing(false);
  };

  const handleCreate = () => {
    if (!newTitle || !newDesc || !customPrice) return;
    cloud.createService({
      requesterId: user.id,
      requesterName: user.name,
      requesterRegion: user.region,
      title: newTitle,
      description: newDesc,
      category: newCategory,
      aiSuggestedPrice: aiSuggestion?.suggestedPrice || 0,
      requesterOffer: parseFloat(customPrice),
      negotiatedPrice: parseFloat(customPrice)
    });
    setActiveTab('my-orders');
    showToast("Demanda publicada com sucesso!");
    setNewTitle('');
    setNewDesc('');
  };

  const handleSendCounterOffer = (serviceId: string, isProvider: boolean) => {
    const amount = parseFloat(counterOffer);
    if (isNaN(amount) || amount <= 0) return;
    
    setIsProcessing(true);
    setTimeout(() => {
      cloud.makeCounterOffer(serviceId, amount, isProvider, customScope);
      setIsProcessing(false);
      setCounterOffer('');
      setCustomScope('');
      setNegotiatingId(null);
      showToast("Contraproposta enviada!");
      if (activeTab === 'browse') setActiveTab('my-orders');
    }, 800);
  };

  const handleAcceptPrice = (serviceId: string) => {
    cloud.acceptPrice(serviceId, user.id);
    showToast("Valor aceito! Realize o pagamento de garantia.");
  };

  const handlePayService = () => {
    if (!activeServiceId) return;
    setIsProcessing(true);
    setTimeout(() => {
      const ok = cloud.payService(activeServiceId, user.id);
      setIsProcessing(false);
      if (ok) {
        setShowPix(false);
        setShowSchedule(true);
        showToast("Pagamento em custódia realizado!");
      } else {
        alert("Saldo insuficiente ou erro no pagamento.");
      }
    }, 1500);
  };

  const handleFinalizeSchedule = () => {
    if (activeServiceId) {
      cloud.scheduleService(activeServiceId, scheduleData);
      setShowSchedule(false);
      setActiveServiceId(null);
      showToast("Serviço agendado!");
    }
  };

  const handleReleasePayment = (serviceId: string) => {
    if (confirm("Deseja marcar como concluído e liberar o pagamento ao profissional?")) {
      const ok = cloud.completeAndRelease(serviceId);
      if (ok) showToast("Serviço concluído e verbas liberadas!");
    }
  };

  // UI DE PAGAMENTO ÚNICO
  if (showPix && currentService) {
    const fee = currentService.negotiatedPrice * 0.05;

    return (
      <div className="space-y-8 animate-slide-up pb-12">
        <div className="flex items-center justify-between px-2">
           <button onClick={() => setShowPix(false)} className="w-10 h-10 flex items-center justify-center text-slate-400">
             <i className="fas fa-arrow-left"></i>
           </button>
           <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Pagamento Seguro EcoServ</h3>
           <div className="w-10"></div>
        </div>

        <section className="bg-white p-10 rounded-[3.5rem] shadow-xl border-2 border-indigo-50 space-y-8 flex flex-col items-center relative overflow-hidden">
          <div className="text-center space-y-2">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Valor Total em Custódia</p>
            <h2 className="text-5xl font-black text-slate-900">R$ {currentService.negotiatedPrice.toFixed(2)}</h2>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-3xl w-full space-y-3">
             <div className="flex justify-between items-center text-[10px] font-black uppercase">
                <span className="text-slate-400">Serviço</span>
                <span className="text-slate-800">R$ {(currentService.negotiatedPrice - fee).toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center text-[10px] font-black uppercase">
                <span className="text-indigo-400">Taxa EcoServ (5%)</span>
                <span className="text-indigo-600">R$ {fee.toFixed(2)}</span>
             </div>
             <div className="h-[1px] bg-slate-200"></div>
             <p className="text-[9px] font-bold text-slate-400 text-center uppercase">A EcoServ retém o valor e só libera após sua confirmação de conclusão.</p>
          </div>

          <div className="w-48 h-48 bg-slate-50 rounded-[3rem] border-4 border-white flex items-center justify-center relative overflow-hidden">
             <i className="fas fa-shield-halved text-indigo-100 text-[100px] absolute"></i>
             <i className="fas fa-qrcode text-indigo-600 text-6xl relative"></i>
          </div>
        </section>

        <button 
          onClick={handlePayService}
          disabled={isProcessing}
          className="w-full h-20 bg-indigo-600 text-white rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95"
        >
          {isProcessing ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-lock"></i>}
          {isProcessing ? 'Processando...' : 'Confirmar Pagamento Seguro'}
        </button>
      </div>
    );
  }

  // UI DE AGENDAMENTO
  if (showSchedule && currentService) {
    return (
      <div className="space-y-8 animate-slide-up pb-12 px-2">
         <div className="text-center space-y-2 pt-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Definir Agenda</h2>
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Saldo garantido pela plataforma!</p>
         </div>

         <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-emerald-500/5 space-y-6">
            <div className="space-y-4">
               <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Data</label>
                  <input type="date" className="w-full bg-slate-50 p-5 rounded-2xl font-bold border-none outline-none mt-1" onChange={e => setScheduleData({...scheduleData, date: e.target.value})} />
               </div>
               <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Horário</label>
                  <input type="time" className="w-full bg-slate-50 p-5 rounded-2xl font-bold border-none outline-none mt-1" onChange={e => setScheduleData({...scheduleData, time: e.target.value})} />
               </div>
               <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Local/Link</label>
                  <input type="text" placeholder="Endereço ou Link" className="w-full bg-slate-50 p-5 rounded-2xl font-bold border-none outline-none mt-1" onChange={e => setScheduleData({...scheduleData, location: e.target.value})} />
               </div>
            </div>
            
            <button 
              onClick={handleFinalizeSchedule}
              className="w-full h-18 bg-emerald-600 text-white rounded-full font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95"
            >
              Confirmar Agenda
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12 relative">
      {/* TOAST FEEDBACK */}
      {successMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up border border-white/10">
           <i className="fas fa-check-circle text-emerald-400"></i>
           <span className="text-[10px] font-black uppercase tracking-widest">{successMsg}</span>
        </div>
      )}

      {/* TABS SUB-MENU */}
      <div className="flex bg-slate-100/60 p-1.5 rounded-full border border-slate-200/50 backdrop-blur-xl">
         {(['browse', 'my-orders', 'create'] as const).map(tab => (
           <button 
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`flex-1 py-3 text-[9px] font-black rounded-full transition-all uppercase tracking-widest ${
               activeTab === tab ? 'bg-white shadow-md text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'
             }`}
           >
             {tab === 'browse' ? 'Mercado' : tab === 'my-orders' ? 'Minhas Ordens' : 'Pedir'}
           </button>
         ))}
      </div>

      {activeTab === 'create' && (
        <section className="bg-white p-10 rounded-[3.5rem] border border-indigo-100 shadow-xl space-y-8 animate-slide-up">
           <div className="text-center">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Postar Nova Demanda</h3>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Sua região: {user.region}</p>
           </div>
           
           <div className="space-y-5">
              <input 
                placeholder="O que você precisa?" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full bg-slate-50 p-5 rounded-2xl font-black text-xs border border-slate-100 outline-none"
              />
              <textarea 
                placeholder="Detalhes do serviço..."
                value={newDesc}
                onBlur={handleFetchAiPrice}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full bg-slate-50 p-5 rounded-2xl font-bold text-xs border border-slate-100 h-28 resize-none"
              />

              {aiSuggestion && (
                <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 animate-fade-in space-y-2">
                   <div className="flex justify-between items-center">
                      <span className="text-[8px] font-black text-indigo-500 uppercase">Sugestão IA</span>
                      <span className="text-lg font-black text-indigo-600">R$ {aiSuggestion.suggestedPrice.toFixed(2)}</span>
                   </div>
                   <p className="text-[9px] font-bold text-slate-500 italic">"{aiSuggestion.justification}"</p>
                </div>
              )}

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                 <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Seu Orçamento Proposto (R$)</p>
                 <input 
                   type="number" 
                   value={customPrice}
                   onChange={e => setCustomPrice(e.target.value)}
                   className="bg-transparent text-2xl font-black text-slate-800 outline-none w-full"
                 />
              </div>
           </div>

           <button 
             onClick={handleCreate}
             disabled={isProcessing}
             className="w-full h-18 bg-indigo-600 text-white rounded-full font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95"
           >
             {isProcessing ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-paper-plane"></i>}
             Publicar Demanda
           </button>
        </section>
      )}

      {activeTab === 'browse' && (
        <div className="space-y-6 animate-slide-up">
           {services.filter(s => s.status === 'OPEN').map(s => (
             <div key={s.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex justify-between items-start">
                   <div className="flex gap-4">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center text-xl">
                        <i className="fas fa-tools"></i>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase">{s.title}</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{s.requesterRegion} • Por {s.requesterName}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-lg font-black text-indigo-600">R$ {s.requesterOffer.toFixed(2)}</p>
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Oferta</p>
                   </div>
                </div>

                <p className="text-[10px] font-medium text-slate-500 leading-relaxed line-clamp-2 px-1">
                   {s.description}
                </p>
                
                <div className="flex gap-2">
                   {negotiatingId === s.id ? (
                     <div className="w-full space-y-3 animate-fade-in bg-slate-50 p-6 rounded-3xl border border-indigo-100">
                        <div className="space-y-2">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">O que você vai realizar deste serviço?</p>
                           <textarea 
                             autoFocus
                             placeholder="Ex: Farei apenas o conserto da fiação, sem trocar a lâmpada."
                             className="w-full bg-white p-4 rounded-2xl font-bold text-[10px] outline-none border border-slate-100 h-20 resize-none"
                             value={customScope}
                             onChange={e => setCustomScope(e.target.value)}
                           />
                        </div>
                        <div className="space-y-2">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Sua Proposta de Valor R$</p>
                           <input 
                             type="number"
                             placeholder="Valor R$"
                             className="w-full bg-white p-4 rounded-2xl font-black text-center text-base outline-none border border-slate-100"
                             value={counterOffer}
                             onChange={e => setCounterOffer(e.target.value)}
                           />
                        </div>
                        <div className="flex gap-2 pt-2">
                           <button 
                             onClick={() => {
                               cloud.acceptServiceInitial(user.id, user.name, s.id, customScope);
                               handleSendCounterOffer(s.id, true);
                             }}
                             className="flex-1 h-12 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md"
                           >Enviar Proposta</button>
                           <button onClick={() => setNegotiatingId(null)} className="h-12 px-4 bg-white border border-slate-200 text-slate-400 rounded-xl">
                              <i className="fas fa-times"></i>
                           </button>
                        </div>
                     </div>
                   ) : (
                     <>
                        <button 
                          onClick={() => {
                            cloud.acceptServiceInitial(user.id, user.name, s.id);
                            setActiveTab('my-orders');
                            showToast("Vinculado com sucesso!");
                          }}
                          className="flex-1 h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-md"
                        >Aceitar R$ {s.requesterOffer.toFixed(2)}</button>
                        <button 
                          onClick={() => setNegotiatingId(s.id)}
                          className="flex-1 h-14 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                        >Contraproposta</button>
                     </>
                   )}
                </div>
             </div>
           ))}
        </div>
      )}

      {activeTab === 'my-orders' && (
        <div className="space-y-6 animate-slide-up">
           {services.filter(s => s.requesterId === user.id || s.providerId === user.id).map(s => {
             const isRequester = s.requesterId === user.id;
             const myOffer = isRequester ? s.requesterOffer : (s.providerOffer || 0);
             const otherOffer = isRequester ? (s.providerOffer || 0) : s.requesterOffer;
             const canIAccept = otherOffer > 0 && otherOffer !== myOffer;

             return (
               <div key={s.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                     <span className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${
                        s.status === 'ACCEPTED' ? 'bg-amber-100 text-amber-600' :
                        s.status === 'SCHEDULED' ? 'bg-indigo-100 text-indigo-600' : 
                        s.status === 'TAX_PAID' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                     }`}>
                        {s.status === 'ACCEPTED' ? 'Negociação' :
                         s.status === 'TAX_PAID' ? 'Garantia Paga' :
                         s.status === 'SCHEDULED' ? 'Executando' : 'Finalizado'}
                     </span>
                     <p className="text-[9px] font-black text-slate-300 uppercase">{s.id}</p>
                  </div>

                  <div>
                     <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{s.title}</h4>
                     {s.agreedScope && (
                       <div className="mt-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                          <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Escopo do Trabalho</p>
                          <p className="text-[10px] font-bold text-indigo-700 italic">"{s.agreedScope}"</p>
                       </div>
                     )}
                  </div>

                  {s.status === 'ACCEPTED' && s.agreementStatus !== 'AGREED' && (
                    <div className="bg-slate-50 p-6 rounded-3xl space-y-6 border border-slate-100 shadow-inner">
                       <div className="grid grid-cols-2 gap-4">
                          <div className={`text-center p-3 rounded-2xl ${!isRequester && canIAccept ? 'bg-emerald-50 ring-2 ring-emerald-200' : 'bg-white/50'}`}>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Cliente</p>
                             <p className="text-lg font-black text-slate-800">R$ {s.requesterOffer.toFixed(2)}</p>
                          </div>
                          <div className={`text-center p-3 rounded-2xl ${isRequester && canIAccept ? 'bg-emerald-50 ring-2 ring-emerald-200' : 'bg-white/50'}`}>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Prestador</p>
                             <p className="text-lg font-black text-indigo-600">{s.providerOffer ? `R$ ${s.providerOffer.toFixed(2)}` : 'Aguardando...'}</p>
                          </div>
                       </div>

                       <div className="space-y-3">
                          {!isRequester && (
                             <textarea 
                               placeholder="Atualizar escopo do serviço..." 
                               className="w-full bg-white p-4 rounded-xl text-[10px] font-bold outline-none border border-slate-100 h-16 resize-none" 
                               value={customScope}
                               onChange={e => setCustomScope(e.target.value)} 
                             />
                          )}
                          <input 
                            type="number"
                            placeholder="Novo valor R$" 
                            className="w-full bg-white p-4 rounded-xl text-xs font-black text-center outline-none border border-slate-100" 
                            onChange={e => setCounterOffer(e.target.value)} 
                          />
                          <div className="flex gap-2">
                             <button 
                               onClick={() => handleAcceptPrice(s.id)} 
                               disabled={!canIAccept}
                               className={`flex-1 h-12 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                                 canIAccept ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                               }`}
                             >
                               {canIAccept ? `Aceitar R$ ${otherOffer.toFixed(2)}` : 'Aguardando'}
                             </button>
                             <button 
                               onClick={() => handleSendCounterOffer(s.id, !isRequester)} 
                               className="flex-1 h-12 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest"
                             >Propor</button>
                          </div>
                       </div>
                    </div>
                  )}

                  {/* BOTÃO ÚNICO DE PAGAMENTO */}
                  {isRequester && s.agreementStatus === 'AGREED' && s.status === 'ACCEPTED' && (
                    <button 
                      onClick={() => { setActiveServiceId(s.id); setShowPix(true); }}
                      className="w-full h-16 bg-indigo-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 animate-pulse"
                    >
                      Pagar Garantia (R$ {s.negotiatedPrice.toFixed(2)})
                    </button>
                  )}

                  {s.status === 'TAX_PAID' && isRequester && (
                    <button 
                      onClick={() => { setActiveServiceId(s.id); setShowSchedule(true); }}
                      className="w-full h-16 bg-blue-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl"
                    >Agendar Serviço</button>
                  )}

                  {s.status === 'SCHEDULED' && isRequester && (
                    <button 
                      onClick={() => handleReleasePayment(s.id)}
                      className="w-full h-16 bg-emerald-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl"
                    >Concluir & Liberar Pagamento</button>
                  )}

                  {s.status === 'SCHEDULED' && s.schedule && (
                    <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex items-center justify-between shadow-sm">
                       <div className="flex-1 pr-4">
                          <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Horário & Local</p>
                          <p className="text-sm font-black text-indigo-700">{new Date(s.schedule.date).toLocaleDateString()} às {s.schedule.time}</p>
                          <p className="text-[9px] font-bold text-indigo-400 mt-1 uppercase truncate">{s.schedule.location}</p>
                       </div>
                       <i className="fas fa-calendar-check text-indigo-600 text-2xl"></i>
                    </div>
                  )}
               </div>
             );
           })}
        </div>
      )}
    </div>
  );
};

export default EcoServices;
