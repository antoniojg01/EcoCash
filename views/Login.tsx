
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { cloud } from '../services/cloudService';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<UserRole | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const allUsers = await cloud.getUsers();
      setUsers(allUsers);
    };
    fetchUsers();
  }, []);

  const roles = [
    { r: UserRole.RESIDENT, i: 'fa-house', l: 'MORADOR', c: 'border-emerald-400 text-emerald-500', bg: 'bg-emerald-50' },
    { r: UserRole.COLLECTOR, i: 'fa-truck', l: 'COLETOR', c: 'border-blue-400 text-blue-500', bg: 'bg-blue-50' },
    { r: UserRole.POINT, i: 'fa-shop', l: 'PONTO', c: 'border-purple-400 text-purple-500', bg: 'bg-purple-50' },
  ];

  const getRoleStyle = (role: UserRole) => {
    switch (role) {
      case UserRole.RESIDENT: return { color: 'bg-emerald-500', icon: 'fa-house', label: 'MORADOR' };
      case UserRole.COLLECTOR: return { color: 'bg-blue-500', icon: 'fa-truck', label: 'COLETOR' };
      case UserRole.POINT: return { color: 'bg-purple-500', icon: 'fa-shop', label: 'PONTO DE COMPRA' };
      default: return { color: 'bg-gray-400', icon: 'fa-user', label: 'USUÁRIO' };
    }
  };

  const ecosystemUsers = users.filter(u => [
    UserRole.RESIDENT, UserRole.COLLECTOR, UserRole.POINT
  ].includes(u.role));

  const filteredUsers = filter 
    ? ecosystemUsers.filter(u => u.role === filter)
    : ecosystemUsers;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 py-8 overflow-y-auto hide-scrollbar">
      <div className="mb-6 text-center animate-fade-in">
        <div className="bg-white text-emerald-600 w-16 h-16 rounded-[1.8rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/10 border border-emerald-50">
          <i className="fas fa-recycle text-3xl"></i>
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">EcoCash</h1>
        <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.3em] mt-1">THE CIRCULAR ECOSYSTEM</p>
      </div>

      <div className="w-full max-w-sm space-y-5">
        
        {/* SELETOR DE PERFIS (DESIGN CENTRALIZADO PARA MOBILE) */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4">
           <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mb-1">Filtrar por Perfil</h2>
           <div className="flex flex-wrap justify-center gap-2">
              {roles.map(item => (
                <button 
                  key={item.r}
                  onClick={() => setFilter(filter === item.r ? null : item.r)}
                  className={`w-[28%] min-h-[70px] rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 ${
                    filter === item.r 
                      ? `${item.c} ${item.bg} scale-105 shadow-md` 
                      : 'border-slate-50 bg-white text-slate-300 opacity-60'
                  }`}
                >
                  <i className={`fas ${item.i} text-lg`}></i>
                  <span className="text-[8px] font-black uppercase text-center leading-none">{item.l}</span>
                </button>
              ))}
           </div>
        </div>

        {/* LISTA DE USUÁRIOS */}
        <section className="bg-white p-3 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
           <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50 mb-2">
              <div className="flex items-center gap-2">
                <i className="fas fa-users text-slate-400 text-xs"></i>
                <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Usuários Ativos</h2>
              </div>
              {filter && (
                <button onClick={() => setFilter(null)} className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Ver Todos</button>
              )}
           </div>
           <div className="space-y-2 max-h-[250px] overflow-y-auto hide-scrollbar px-1 pb-2">
              {filteredUsers.length > 0 ? filteredUsers.map(u => {
                const style = getRoleStyle(u.role);
                return (
                  <button 
                    key={u.id}
                    onClick={() => onLogin(u)}
                    className="w-full bg-[#f8fafc] p-4 rounded-2xl flex items-center gap-4 group transition-all hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-md active:scale-[0.98]"
                  >
                    <div className={`w-10 h-10 ${style.color} rounded-xl flex items-center justify-center text-white text-sm shadow-md group-hover:scale-105 transition-transform`}>
                      <i className={`fas ${style.icon}`}></i>
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-bold text-slate-800 text-xs leading-none mb-1">{u.name}</h3>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{style.label}</p>
                    </div>
                    <i className="fas fa-chevron-right text-slate-200 text-[10px] pr-2 group-hover:text-emerald-500"></i>
                  </button>
                );
              }) : (
                <div className="py-10 text-center text-slate-300">
                   <p className="text-[9px] font-black uppercase tracking-widest">Nenhum resultado</p>
                </div>
              )}
           </div>
        </section>

      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-slate-300">
          <i className="fas fa-shield-halved text-[10px]"></i>
          <p className="text-[8px] font-black uppercase tracking-widest">Security Protocols Active</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
