
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
    
    // Disparamos o evento sem recarregar a página
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md space-y-8 my-10">
        <div className="text-center mb-10">
          <div className="bg-emerald-600 text-white w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-200">
            <i className="fas fa-recycle text-4xl"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">EcoCash</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Conectando a Economia Circular</p>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
          <div className="flex bg-slate-100 p-1.5 rounded-full mb-10">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 text-[10px] font-black rounded-full transition-all uppercase tracking-widest ${isLogin ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400'}`}>Login</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 text-[10px] font-black rounded-full transition-all uppercase tracking-widest ${!isLogin ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400'}`}>Cadastro</button>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-4 animate-slide-up">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome Completo</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border-none p-5 rounded-2xl font-bold text-sm mt-1 outline-none" placeholder="Nome" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 text-center block mb-2">Papéis:</label>
                  <div className="grid grid-cols-5 gap-1 mt-2">
                    {[
                      { r: UserRole.RESIDENT, i: 'fa-house' },
                      { r: UserRole.COLLECTOR, i: 'fa-truck' },
                      { r: UserRole.POINT, i: 'fa-shop' },
                      { r: UserRole.PRODUCER, i: 'fa-sun' },
                      { r: UserRole.CONSUMER, i: 'fa-bolt' }
                    ].map(item => (
                      <button key={item.r} type="button" onClick={() => toggleRole(item.r)} className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${selectedRoles.includes(item.r) ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                        <i className={`fas ${item.i} text-xs`}></i>
                        <span className="text-[6px] font-black uppercase tracking-tighter truncate w-full text-center">{item.r.slice(0,3)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border-none p-5 rounded-2xl font-bold text-sm outline-none" placeholder="E-mail" />
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border-none p-5 rounded-2xl font-bold text-sm outline-none" placeholder="Senha" />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-500 text-[10px] font-bold rounded-2xl text-center border border-red-100">
                {error}
                {showDemoFallback && (
                  <button type="button" onClick={enterDemoMode} className="w-full mt-2 p-2 bg-amber-500 text-white rounded-xl uppercase">Entrar no Modo Demo</button>
                )}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full h-18 bg-slate-900 text-white rounded-full font-black text-[12px] uppercase tracking-widest shadow-xl active:scale-95">
              {loading ? <i className="fas fa-circle-notch animate-spin"></i> : <>{isLogin ? 'Entrar' : 'Cadastrar'}</>}
            </button>
          </form>

          <div className="mt-6 flex gap-2">
            <button onClick={() => handleSocialLogin('google')} className="flex-1 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center"><i className="fab fa-google text-slate-400"></i></button>
            <button onClick={enterDemoMode} className="flex-1 h-12 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-amber-600 text-[8px] font-black uppercase">Demo Quick Start</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPortal;
