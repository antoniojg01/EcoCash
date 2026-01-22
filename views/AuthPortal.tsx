
import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { checkFirebaseStatus } from '../firebase';
import { cloud } from '../services/cloudService';
import { UserRole } from '../types';

const AuthPortal: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([UserRole.RESIDENT]);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDemoFallback, setShowDemoFallback] = useState(false);

  const toggleRole = (role: UserRole) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length > 1) {
        setSelectedRoles(prev => prev.filter(r => r !== role));
      }
    } else {
      setSelectedRoles(prev => [...prev, role]);
    }
  };

  const enterDemoMode = async () => {
    setLoading(true);
    const userId = `demo_${email ? email.replace(/[^a-zA-Z0-9]/g, '') : 'guest'}_${Date.now()}`;
    
    await cloud.createUserProfile(userId, { 
      name: name || "Usuário Demo", 
      roles: selectedRoles 
    });
    
    localStorage.setItem('ecocash_demo_auth', userId);
    localStorage.setItem('ecocash_force_demo', 'true');
    
    window.dispatchEvent(new Event('auth_change'));
    setLoading(false);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowDemoFallback(false);

    const status = checkFirebaseStatus();

    try {
      if (status.enabled && status.auth) {
        if (isLogin) {
          await signInWithEmailAndPassword(status.auth, email, password);
        } else {
          const { user } = await createUserWithEmailAndPassword(status.auth, email, password);
          await cloud.createUserProfile(user.uid, { name, roles: selectedRoles });
        }
      } else {
        await enterDemoMode();
      }
    } catch (err: any) {
      const msg = err.message || "";
      setError(msg.replace("Firebase:", ""));
      if (msg.includes("api-key") || msg.includes("network-request-failed")) {
        setShowDemoFallback(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (providerName: 'google' | 'apple') => {
    setSocialLoading(providerName);
    setError(null);
    const status = checkFirebaseStatus();
    
    try {
      if (status.enabled && status.auth) {
        let provider;
        if (providerName === 'google') {
          provider = new GoogleAuthProvider();
        } else {
          provider = new OAuthProvider('apple.com');
        }
        const result = await signInWithPopup(status.auth, provider);
        const user = result.user;
        await cloud.createUserProfile(user.uid, { 
          name: user.displayName || "Usuário Social", 
          roles: selectedRoles 
        });
      } else {
        await enterDemoMode();
      }
    } catch (err: any) {
      setError(`Erro no login: ${err.message}`);
      setShowDemoFallback(true);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 animate-fade-in overflow-y-auto hide-scrollbar">
      <div className="w-full max-w-sm space-y-6 my-8">
        <div className="text-center mb-6">
          <div className="bg-emerald-600 text-white w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-100">
            <i className="fas fa-recycle text-3xl"></i>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">EcoCash</h1>
          <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.4em] mt-1">THE CIRCULAR ECOSYSTEM</p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100">
          <div className="flex bg-slate-100 p-1.5 rounded-full mb-8">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 text-[10px] font-black rounded-full transition-all uppercase tracking-widest ${isLogin ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400'}`}>Login</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 text-[10px] font-black rounded-full transition-all uppercase tracking-widest ${!isLogin ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400'}`}>Cadastro</button>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-3 animate-slide-up mb-6">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome Completo</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-100" placeholder="Seu nome" />
              </div>
            )}

            <div className="space-y-4 mb-8">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center block mb-2">Selecione seus papéis:</label>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { r: UserRole.RESIDENT, i: 'fa-house', l: 'MORADOR', c: 'border-emerald-400 text-emerald-500', bg: 'bg-emerald-50' },
                  { r: UserRole.COLLECTOR, i: 'fa-truck', l: 'COLETOR', c: 'border-blue-400 text-blue-500', bg: 'bg-blue-50' },
                  { r: UserRole.POINT, i: 'fa-shop', l: 'PONTO', c: 'border-purple-400 text-purple-500', bg: 'bg-purple-50' }
                ].map(item => {
                  const isActive = selectedRoles.includes(item.r);
                  return (
                    <button 
                      key={item.r} 
                      type="button" 
                      onClick={() => toggleRole(item.r)} 
                      className={`w-[28%] sm:w-[30%] min-h-[75px] rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                        isActive 
                          ? `${item.c} ${item.bg} scale-105 shadow-sm` 
                          : 'border-slate-50 bg-slate-50 text-slate-300 opacity-60'
                      }`}
                    >
                      <i className={`fas ${item.i} text-lg`}></i>
                      <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-none">{item.l}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-4">E-mail</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-100 transition-all" placeholder="exemplo@email.com" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-4">Senha</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-100 transition-all" placeholder="••••••••" />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-500 text-[9px] font-bold rounded-2xl text-center border border-red-100">
                {error}
                {showDemoFallback && (
                  <button type="button" onClick={enterDemoMode} className="w-full mt-2 p-2 bg-amber-500 text-white rounded-xl uppercase">Entrar no Modo Demo</button>
                )}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full h-16 bg-slate-900 text-white rounded-full font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4">
              {loading ? <i className="fas fa-circle-notch animate-spin"></i> : <>{isLogin ? 'Entrar' : 'Cadastrar'}</>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 flex gap-2">
            <button onClick={() => handleSocialLogin('google')} className="flex-1 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"><i className="fab fa-google text-slate-400"></i></button>
            <button onClick={enterDemoMode} className="flex-1 h-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 text-[9px] font-black uppercase tracking-widest hover:bg-amber-100 transition-colors shadow-sm">Demo Access</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPortal;
