
import React from 'react';
import { User, UserRole } from '../types';
import { cloud } from '../services/cloudService';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const users = cloud.getUsers();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
      
      <div className="mb-12 text-center animate-fade-in">
        <div className="bg-emerald-600 text-white w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-200 rotate-6 hover:rotate-0 transition-transform duration-500">
          <i className="fas fa-recycle text-5xl"></i>
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">EcoCash</h1>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Cloud Infrastructure</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <p className="text-gray-400 font-black text-center text-[10px] uppercase tracking-widest mb-8">Selecione sua conta</p>
        
        {users.map(u => (
          <button 
            key={u.id}
            onClick={() => onLogin(u)}
            className="w-full bg-gray-50 p-6 rounded-[2rem] border-2 border-transparent hover:border-emerald-500 hover:bg-white transition-all flex items-center gap-5 group shadow-sm hover:shadow-xl"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg transition-transform group-hover:scale-110 ${
              u.role === UserRole.RESIDENT ? 'bg-emerald-500' : u.role === UserRole.COLLECTOR ? 'bg-blue-500' : 'bg-purple-500'
            }`}>
              <i className={`fas ${
                u.role === UserRole.RESIDENT ? 'fa-house' : u.role === UserRole.COLLECTOR ? 'fa-truck-fast' : 'fa-shop'
              }`}></i>
            </div>
            <div className="text-left">
              <h3 className="font-black text-gray-900 text-lg leading-tight">{u.name}</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                {u.role === UserRole.RESIDENT ? 'Morador' : u.role === UserRole.COLLECTOR ? 'Coletor' : 'Ponto de Compra'}
              </p>
            </div>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <i className="fas fa-chevron-right text-emerald-500"></i>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-16 flex items-center gap-2 text-gray-300">
        <i className="fas fa-cloud-bolt"></i>
        <p className="text-[9px] font-black uppercase tracking-widest">v1.2.4 Cloud Distributed</p>
      </div>
    </div>
  );
};

export default Login;
