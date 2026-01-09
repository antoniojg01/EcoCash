import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

// --- ENUMS & INTERFACES ---
enum UserRole { RESIDENT = 'MORADOR', COLLECTOR = 'COLETOR', POINT = 'PONTO' }
enum RequestStatus { PENDING = 'PENDENTE', ACCEPTED = 'ACEITO', COLLECTED = 'COLETADO', COMPLETED = 'CONCLUÍDO' }

interface User {
  id: string;
  name: string;
  role: UserRole;
  balance: number;
}

interface PlasticOffer {
  id: string;
  residentId: string;
  type: string;
  weight: number;
  value: number;
  status: RequestStatus;
  collectorId?: string;
  actualWeight?: number;
}

// --- CONSTANTS ---
const STORAGE_KEY = 'ecocash_db_v5';
const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'João Silva', role: UserRole.RESIDENT, balance: 42.50 },
  { id: 'u2', name: 'Carlos Santos', role: UserRole.COLLECTOR, balance: 115.80 },
  { id: 'u3', name: 'Ponto Eco-Recicle', role: UserRole.POINT, balance: 2500.00 }
];

// --- APP COMPONENT ---
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [offers, setOffers] = useState<PlasticOffer[]>([]);
  const [view, setView] = useState<'home' | 'history' | 'profile'>('home');
  const [subTab, setSubTab] = useState<'available' | 'ongoing'>('available');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmedWeight, setConfirmedWeight] = useState('');
  const [activeReceipt, setActiveReceipt] = useState<PlasticOffer | null>(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setOffers(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
  }, [offers]);

  // Actions
  const handleLogin = (u: User) => {
    setUser(u);
    setSubTab('available');
    setView('home');
  };
  const handleLogout = () => setUser(null);

  const createOffer = async (description: string) => {
    if (!user || !description) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    
    const newOffer: PlasticOffer = {
      id: `ECO-${Math.floor(1000 + Math.random() * 9000)}`,
      residentId: user.id,
      type: description,
      weight: 1.5 + Math.random() * 4,
      value: 3.0 + Math.random() * 12,
      status: RequestStatus.PENDING
    };
    
    setOffers([newOffer, ...offers]);
    setLoading(false);
    setIsModalOpen(false);
  };

  const updateStatus = (id: string, status: RequestStatus, extra = {}) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status, ...extra } : o));
  };

  const handleCollect = (offer: PlasticOffer) => {
    const weight = parseFloat(confirmedWeight);
    if (isNaN(weight) || weight <= 0) return alert("Insira o peso medido.");
    
    const newValue = (offer.value / offer.weight) * weight;
    const updatedOffer = { ...offer, status: RequestStatus.COLLECTED, actualWeight: weight, value: newValue };
    
    updateStatus(offer.id, RequestStatus.COLLECTED, { 
      actualWeight: weight,
      value: newValue
    });
    setConfirmedWeight('');
    // Abre o recibo automaticamente após coletar
    setActiveReceipt(updatedOffer);
  };

  const handleLiquidate = (id: string) => {
    const offer = offers.find(o => o.id === id);
    if (!offer || !user) return;
    
    if (user.balance < offer.value) return alert("Saldo insuficiente no Ponto!");
    
    const resVal = offer.value * 0.7;
    const colVal = offer.value * 0.3;
    
    updateStatus(id, RequestStatus.COMPLETED);
    setUser({ ...user, balance: user.balance - offer.value });
    alert(`Liquidação efetuada!\nMorador: +R$ ${resVal.toFixed(2)}\nColetor: +R$ ${colVal.toFixed(2)}`);
  };

  const handleShareReceipt = async (offer: PlasticOffer) => {
    const text = `Recibo EcoCash: Coleta ${offer.id}\nMaterial: ${offer.type}\nPeso: ${offer.actualWeight}kg\nValor: R$ ${offer.value.toFixed(2)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Recibo EcoCash', text });
      } catch (e) { console.error(e); }
    } else {
      alert("Copiado para a área de transferência:\n\n" + text);
    }
  };

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden max-w-[390px] mx-auto w-full shadow-2xl relative border-x border-slate-200">
      
      {/* HEADER COMPACTO */}
      <header className="bg-emerald-600 px-5 pt-10 pb-6 rounded-b-[2rem] shadow-lg flex justify-between items-center shrink-0 z-50">
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase text-emerald-200 tracking-widest leading-none mb-1">EcoCash Mobile</span>
          <h1 className="text-lg font-black text-white leading-tight tracking-tight">{user.name.split(' ')[0]}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white/15 px-2.5 py-1.5 rounded-lg border border-white/20 backdrop-blur-sm">
             <span className="text-white font-black text-xs">R$ {user.balance.toFixed(2)}</span>
          </div>
          <button onClick={handleLogout} className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-white active:bg-white/20 transition-all">
            <i className="fas fa-power-off text-sm"></i>
          </button>
        </div>
      </header>

      {/* MAIN SCROLL AREA */}
      <main className="flex-1 overflow-y-auto px-5 pt-5 pb-28 hide-scrollbar">
        {view === 'home' && (
          <div className="animate-fade-in space-y-5">
            
            {user.role === UserRole.RESIDENT && (
              <>
                <div className="bg-white p-5 rounded-[1.8rem] shadow-sm border border-slate-100 space-y-3 text-center">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-lg mx-auto">
                    <i className="fas fa-plus"></i>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Vender material</h3>
                    <p className="text-[10px] text-slate-400 font-medium">IA avalia o preço médio.</p>
                  </div>
                  <button onClick={() => setIsModalOpen(true)} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all">Novo Anúncio</button>
                </div>
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Meus Anúncios</h4>
                <div className="space-y-3">
                  {offers.filter(o => o.residentId === user.id).map(o => <CardOffer key={o.id} offer={o} />)}
                  {offers.filter(o => o.residentId === user.id).length === 0 && <EmptyState />}
                </div>
              </>
            )}

            {user.role === UserRole.COLLECTOR && (
              <>
                <div className="bg-blue-600 p-5 rounded-[1.8rem] shadow-lg text-white flex justify-between items-center mb-4">
                  <div>
                    <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Coletas do Dia</p>
                    <h3 className="text-xl font-black">12.8 KG</h3>
                  </div>
                  <i className="fas fa-motorcycle text-2xl opacity-30"></i>
                </div>

                <div className="flex bg-slate-200/50 p-1 rounded-xl mb-4">
                  <button onClick={() => setSubTab('available')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${subTab === 'available' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Disponíveis</button>
                  <button onClick={() => setSubTab('ongoing')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${subTab === 'ongoing' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Minhas Coletas</button>
                </div>

                <div className="space-y-3">
                  {subTab === 'available' ? (
                    offers.filter(o => o.status === RequestStatus.PENDING).map(o => (
                      <div key={o.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-black text-slate-900 text-[13px]">{o.type}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{o.weight.toFixed(1)}kg • 1.4km</p>
                          </div>
                          <span className="text-emerald-600 font-black text-sm">R$ {o.value.toFixed(2)}</span>
                        </div>
                        <button onClick={() => updateStatus(o.id, RequestStatus.ACCEPTED, { collectorId: user.id })} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest active:bg-blue-700">Aceitar Coleta</button>
                      </div>
                    ))
                  ) : (
                    offers.filter(o => o.collectorId === user.id && o.status !== RequestStatus.COMPLETED).map(o => (
                      <div key={o.id} className={`bg-white p-4 rounded-2xl border-2 shadow-sm flex flex-col gap-3 transition-all ${o.status === RequestStatus.COLLECTED ? 'border-emerald-500' : 'border-blue-200'}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded-md">{o.id}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase">{o.status}</span>
                        </div>
                        <p className="font-black text-slate-900 text-sm">{o.type}</p>
                        {o.status === RequestStatus.ACCEPTED && (
                          <div className="flex gap-2">
                             <input 
                              type="number" 
                              placeholder="Peso Real" 
                              className="flex-1 bg-slate-50 border border-slate-100 p-2 rounded-lg text-xs font-black outline-none focus:border-blue-500"
                              value={confirmedWeight}
                              onChange={e => setConfirmedWeight(e.target.value)}
                             />
                             <button onClick={() => handleCollect(o)} className="bg-emerald-600 text-white px-4 rounded-lg text-[9px] font-black uppercase">Coletar</button>
                          </div>
                        )}
                        {o.status === RequestStatus.COLLECTED && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase text-center py-1 bg-emerald-50 rounded-lg">Aguardando Validação</p>
                            <button onClick={() => setActiveReceipt(o)} className="w-full bg-slate-100 text-slate-600 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                              <i className="fas fa-receipt"></i> Ver Recibo Digital
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  {((subTab === 'available' && offers.filter(o => o.status === RequestStatus.PENDING).length === 0) || 
                    (subTab === 'ongoing' && offers.filter(o => o.collectorId === user.id).length === 0)) && <EmptyState />}
                </div>
              </>
            )}

            {user.role === UserRole.POINT && (
              <>
                <div className="bg-purple-600 p-5 rounded-[1.8rem] shadow-lg text-white mb-5">
                   <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Ponto de Liquidação</p>
                   <h3 className="text-xl font-black">Terminal Ativo</h3>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Coletas para Liquidar</h4>
                  <div className="space-y-3">
                    {offers.filter(o => o.status === RequestStatus.COLLECTED).map(o => (
                      <div key={o.id} className="bg-slate-50 p-4 rounded-2xl flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-black text-slate-900 text-[13px]">{o.type}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{o.id} • {o.actualWeight}kg</p>
                          </div>
                          <p className="text-sm font-black text-slate-900">R$ {o.value.toFixed(2)}</p>
                        </div>
                        <button onClick={() => handleLiquidate(o.id)} className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest active:bg-purple-700">Validar Pagamento</button>
                      </div>
                    ))}
                    {offers.filter(o => o.status === RequestStatus.COLLECTED).length === 0 && (
                      <p className="text-[10px] font-black text-slate-300 text-center py-8">Nenhuma coleta aguardando validação</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {view === 'history' && (
          <div className="animate-fade-in space-y-4">
            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Movimentações</h4>
            <div className="space-y-2">
              {offers.filter(o => o.status === RequestStatus.COMPLETED).map(o => (
                <div key={o.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                   <div className="flex items-center gap-3">
                      <i className="fas fa-check-circle text-emerald-500 text-sm"></i>
                      <div>
                         <p className="text-[11px] font-black text-slate-900">{o.type}</p>
                         <p className="text-[9px] font-bold text-slate-400">{o.id}</p>
                      </div>
                   </div>
                   <span className="text-[11px] font-black text-emerald-600">+R$ {o.value.toFixed(2)}</span>
                </div>
              ))}
              {offers.filter(o => o.status === RequestStatus.COMPLETED).length === 0 && <EmptyState />}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER NAVIGATION */}
      <nav className="glass-effect border-t border-slate-100 absolute bottom-0 left-0 right-0 h-20 px-4 pb-2 flex justify-between items-center z-40">
        <NavButton active={view === 'home'} icon="fa-home" label="Dashboard" onClick={() => setView('home')} />
        <NavButton active={view === 'history'} icon="fa-receipt" label="Extrato" onClick={() => setView('history')} />
        <NavButton active={view === 'profile'} icon="fa-user-circle" label="Perfil" onClick={() => setView('profile')} />
      </nav>

      {/* MODAL: RECIBO DIGITAL */}
      {activeReceipt && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white w-full max-w-[320px] rounded-[2rem] overflow-hidden shadow-2xl animate-slide-up flex flex-col">
            <div className="bg-emerald-600 p-6 text-center text-white space-y-2">
               <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-receipt text-xl"></i>
               </div>
               <h3 className="font-black uppercase tracking-widest text-sm">Recibo de Coleta</h3>
               <p className="text-[10px] font-bold opacity-70">EcoCash Cloud • {activeReceipt.id}</p>
            </div>
            
            <div className="p-6 space-y-6">
               <div className="space-y-3 font-mono text-[11px] border-b border-dashed border-slate-100 pb-5">
                  <div className="flex justify-between">
                     <span className="text-slate-400">MATERIAL:</span>
                     <span className="font-black text-slate-900">{activeReceipt.type}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-slate-400">PESO CONFIRMADO:</span>
                     <span className="font-black text-slate-900">{activeReceipt.actualWeight} KG</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-50 pt-3">
                     <span className="text-slate-400">VALOR ESTIMADO:</span>
                     <span className="font-black text-emerald-600">R$ {activeReceipt.value.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                     <span className="text-slate-400">REPASSE COLETOR:</span>
                     <span className="font-black text-blue-600">R$ {(activeReceipt.value * 0.3).toFixed(2)}</span>
                  </div>
               </div>

               <div className="space-y-3">
                  <button 
                    onClick={() => handleShareReceipt(activeReceipt)}
                    className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <i className="fas fa-share-alt"></i> Compartilhar
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="w-full border-2 border-slate-100 text-slate-400 py-3.5 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-download"></i> Baixar PDF
                  </button>
                  <button 
                    onClick={() => setActiveReceipt(null)}
                    className="w-full py-2 text-slate-300 font-black uppercase text-[8px] tracking-[0.2em]"
                  >
                    Fechar
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO ANÚNCIO */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end animate-fade-in">
          <div className="bg-white w-full rounded-t-[2.5rem] p-6 animate-slide-up pb-10 shadow-2xl">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6"></div>
            <div className="flex justify-between items-center mb-5">
               <h2 className="text-xl font-black text-slate-900">Vender Plástico</h2>
               <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"><i className="fas fa-times"></i></button>
            </div>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">O que você tem?</label>
                <textarea 
                  id="material-desc"
                  placeholder="Ex: 5 Garrafas PET e 2 Caixas..."
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl h-28 outline-none focus:border-emerald-500 font-bold transition-all text-sm text-slate-900 resize-none"
                ></textarea>
              </div>
              <button 
                disabled={loading}
                onClick={() => createOffer((document.getElementById('material-desc') as HTMLTextAreaElement).value)}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
                {loading ? 'Calculando Preço...' : 'Publicar Agora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- HELPERS ---

const NavButton: React.FC<{ active: boolean, icon: string, label: string, onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} className="flex-1 flex flex-col items-center justify-center gap-0.5 group h-full">
    <div className={`w-10 h-9 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-emerald-50 text-emerald-600 shadow-inner' : 'text-slate-300 group-hover:bg-slate-50'}`}>
      <i className={`fas ${icon} ${active ? 'text-base' : 'text-sm'}`}></i>
    </div>
    <span className={`text-[7px] font-black uppercase tracking-[0.1em] ${active ? 'text-emerald-600' : 'text-slate-400'}`}>{label}</span>
  </button>
);

const CardOffer: React.FC<{ offer: PlasticOffer }> = ({ offer }) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 transition-transform active:scale-[0.98]">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base ${
      offer.status === RequestStatus.PENDING ? 'bg-amber-50 text-amber-500' : 
      offer.status === RequestStatus.COMPLETED ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-500'
    }`}>
      <i className={`fas ${offer.status === RequestStatus.PENDING ? 'fa-hourglass-start' : offer.status === RequestStatus.COMPLETED ? 'fa-check-double' : 'fa-truck-loading'}`}></i>
    </div>
    <div className="flex-1 overflow-hidden">
      <h5 className="font-black text-slate-900 text-[13px] leading-tight truncate">{offer.type}</h5>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{offer.id} • {offer.weight.toFixed(1)}kg</p>
    </div>
    <div className="text-right shrink-0">
       <p className="text-xs font-black text-slate-900">R$ {offer.value.toFixed(2)}</p>
       <p className={`text-[7px] font-black uppercase tracking-widest ${
         offer.status === RequestStatus.PENDING ? 'text-amber-500' : 
         offer.status === RequestStatus.COMPLETED ? 'text-emerald-600' : 'text-blue-500'
       }`}>{offer.status}</p>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="py-12 text-center space-y-3">
    <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto text-slate-200 text-2xl">
      <i className="fas fa-ghost"></i>
    </div>
    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tudo vazio por aqui</p>
  </div>
);

const LoginScreen: React.FC<{ onLogin: (u: User) => void }> = ({ onLogin }) => (
  <div className="h-full flex flex-col items-center justify-center p-6 bg-white overflow-y-auto max-w-[390px] mx-auto w-full shadow-2xl border-x border-slate-100">
    <div className="w-16 h-16 bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center text-3xl shadow-xl mb-5 rotate-3 animate-bounce">
      <i className="fas fa-recycle"></i>
    </div>
    <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-1">EcoCash</h1>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10">Economia Circular 2.5</p>
    
    <div className="w-full space-y-3">
      {INITIAL_USERS.map(u => (
        <button 
          key={u.id} 
          onClick={() => onLogin(u)}
          className="w-full p-4 bg-slate-50 rounded-[1.8rem] flex items-center gap-4 hover:bg-emerald-50 border-2 border-transparent hover:border-emerald-100 transition-all group active:scale-95"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${
            u.role === UserRole.RESIDENT ? 'bg-emerald-500' : u.role === UserRole.COLLECTOR ? 'bg-blue-500' : 'bg-purple-500'
          }`}>
            <i className={`fas ${u.role === UserRole.RESIDENT ? 'fa-home' : u.role === UserRole.COLLECTOR ? 'fa-motorcycle' : 'fa-store'} text-sm`}></i>
          </div>
          <div className="text-left flex-1">
            <p className="font-black text-slate-900 text-base leading-none mb-1">{u.name}</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{u.role}</p>
          </div>
          <i className="fas fa-chevron-right text-xs text-slate-200 group-hover:text-emerald-500 transition-colors"></i>
        </button>
      ))}
    </div>
    
    <div className="mt-10 flex flex-col items-center gap-2">
       <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] flex items-center gap-1.5">
          <i className="fas fa-shield-check text-emerald-500/30"></i> 
          Secure Smart Contracts
       </p>
    </div>
  </div>
);

export default App;