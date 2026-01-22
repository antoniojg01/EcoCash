
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { cloud } from '../services/cloudService';

interface ProducerDashboardProps {
  user: User;
}

const ProducerDashboard: React.FC<ProducerDashboardProps> = ({ user }) => {
  const [kwhInput, setKwhInput] = useState('');
  const [billValue, setBillValue] = useState('');
  const [barcode, setBarcode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const metrics = user.energyMetrics;

  if (!metrics) return null;

  const region = user.region || 'Sudeste';
  const regionalValue = cloud.getProducerPrice(region); 
  const estimatedKwh = kwhInput ? parseFloat(kwhInput) : 0;
  const estimatedRevenue = estimatedKwh * regionalValue;

  const handleInjectEnergy = () => {
    const amount = parseFloat(kwhInput);
    if (isNaN(amount) || amount <= 0) return;

    setIsProcessing(true);
    setTimeout(() => {
      cloud.injectEnergyToCredits(user.id, amount);
      setIsProcessing(false);
      setKwhInput('');
      alert(`Sucesso! ${amount} kWh convertidos em R$ ${ (amount * regionalValue).toFixed(2) } em créditos de venda.`);
    }, 1500);
  };

  const startScanner = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setTimeout(() => {
        stopScanner();
        setBillValue('280.00');
        setBarcode('00190.00009 02345.678901 23456.789012 8 12340000028000');
        alert("Código detectado!");
      }, 3000);
    } catch (err) {
      alert("Erro ao abrir câmera.");
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const handleCompleteAssignment = (assignmentId: string) => {
    cloud.completeAssignment(user.id, assignmentId);
  };

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const progressPercent = Math.min(Math.max(((currentHour - 6) / 12) * 100, 0), 100);

  const pendingAssignments = metrics.pendingAssignments?.filter((a: any) => a.status === 'PENDING') || [];

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      {/* SCANNER OVERLAY */}
      {isScanning && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-0 border-[40px] border-black/60 pointer-events-none">
            <div className="w-full h-full border-2 border-amber-500 rounded-2xl relative" />
          </div>
          <button onClick={stopScanner} className="absolute bottom-12 w-16 h-16 bg-white/20 text-white rounded-full flex items-center justify-center border border-white/20 backdrop-blur-md">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* HEADER DO PRODUTOR */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm">
            <i className="fas fa-sun text-2xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">{user.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-amber-400 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Nível {metrics.level}</span>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Capacidade: {metrics.systemCapacityKwp} kWp</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Status</p>
          <div className="flex items-center justify-end gap-1.5 mt-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[11px] font-black text-emerald-500 uppercase">Online</span>
          </div>
        </div>
      </div>

      {/* LIQUIDAÇÃO DE FATURAS (SISTEMA P2P PARA O PRÓPRIO PRODUTOR) */}
      <section className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 space-y-8 animate-slide-up">
         <div className="flex items-center justify-between">
            <div>
               <h4 className="text-xl font-black text-slate-800 tracking-tight">Pagar sua Fatura</h4>
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Economia Direta via Energy Cloud</p>
            </div>
            <i className="fas fa-bolt-lightning text-amber-500"></i>
         </div>

         <div className="space-y-6">
            {/* INPUT DE VALOR COM SCANNER */}
            <div className="flex gap-3">
               <div className="flex-1 bg-slate-50 border-2 border-slate-100 p-6 rounded-3xl flex flex-col focus-within:border-amber-400 focus-within:bg-white transition-all shadow-inner">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor da Conta</label>
                  <div className="flex items-center gap-2">
                     <span className="text-sm font-black text-slate-300">R$</span>
                     <input 
                       value={billValue}
                       onChange={e => setBillValue(e.target.value)}
                       placeholder="0.00"
                       className="flex-1 bg-transparent font-black text-xl outline-none text-slate-800"
                     />
                  </div>
               </div>
               <button 
                 onClick={startScanner}
                 className="w-20 bg-slate-900 text-white rounded-3xl shadow-xl flex items-center justify-center text-lg active:scale-95"
               >
                 <i className="fas fa-camera"></i>
               </button>
            </div>

            {/* INPUT DE CÓDIGO DE BARRAS */}
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl shadow-inner">
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Linha Digitável</label>
               <input 
                 value={barcode}
                 onChange={e => setBarcode(e.target.value)}
                 placeholder="00000.00000..."
                 className="w-full bg-transparent font-bold text-[10px] outline-none text-slate-600"
               />
            </div>

            <button 
              onClick={() => alert('Processando liquidação P2P...')}
              disabled={!billValue}
              className="w-full h-16 bg-amber-500 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-20 transition-all"
            >
              Liquidat com Spread P2P
            </button>
         </div>
      </section>

      {/* TAREFAS DE VINCULAÇÃO */}
      <section className="space-y-5">
         <div className="flex justify-between items-center px-4">
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Pendências de Vinculação</h4>
            <span className="bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">{pendingAssignments.length} AGUARDANDO</span>
         </div>

         {pendingAssignments.length === 0 ? (
           <div className="bg-slate-50 p-10 rounded-[3rem] border border-dashed border-slate-200 text-center">
              <i className="fas fa-check-double text-slate-200 text-2xl mb-3"></i>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tudo em dia com as usinas</p>
           </div>
         ) : (
           <div className="space-y-4">
              {pendingAssignments.map((a: any) => {
                const netToProducer = a.kwhAmount * regionalValue;
                const totalConsumerPaid = netToProducer + (a.platformFee || 0);
                
                return (
                  <div key={a.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6 animate-slide-up">
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Unidade Consumidora</p>
                           <h5 className="text-sm font-black text-slate-800">{a.consumerName}</h5>
                        </div>
                        <div className="text-right">
                           <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Seu Repasse Líquido</p>
                           <p className="text-2xl font-black text-emerald-600 leading-none">R$ {netToProducer.toFixed(2)}</p>
                        </div>
                     </div>

                     <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                           <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Composição do Valor</p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Transação Intermediada EcoCash</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Total do Consumidor</p>
                              <p className="text-xs font-black text-slate-600">R$ {totalConsumerPaid.toFixed(2)}</p>
                           </div>
                        </div>
                        
                        <div className="h-[1px] bg-slate-200 w-full opacity-30"></div>
                        
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-50">
                              <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Margem EcoCash</p>
                              <p className="text-xs font-black text-blue-600">R$ {(a.platformFee || 0).toFixed(2)}</p>
                           </div>
                           <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-50">
                              <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Repasse Produtor</p>
                              <p className="text-xs font-black text-emerald-600">R$ {netToProducer.toFixed(2)}</p>
                           </div>
                        </div>
                     </div>

                     <div className="pt-2">
                        <button 
                          onClick={() => handleCompleteAssignment(a.id)}
                          className="w-full h-16 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95"
                        >
                          Marcar como Vinculada
                        </button>
                     </div>
                  </div>
                )
              })}
           </div>
         )}
      </section>

      {/* GERAÇÃO EM TEMPO REAL */}
      <section className="bg-[#1e293b] p-10 rounded-[3.5rem] text-white space-y-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4">Produção Instantânea</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter">{metrics.currentKw.toFixed(1)}</span>
              <span className="text-xl font-black text-amber-400">kW</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Total Hoje</p>
            <p className="text-2xl font-black text-white">{metrics.dailyKwh.toFixed(1)} <span className="text-xs text-slate-500 font-bold">kWh</span></p>
          </div>
        </div>
        <div className="h-4 bg-slate-800 rounded-full overflow-hidden p-1">
          <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </section>

      {/* ABASTECIMENTO COM TUTORIAL INTEGRADO */}
      <section className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-8">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Abastecer Rede</h3>
            <button 
              onClick={() => setShowTutorial(!showTutorial)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${showTutorial ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
            >
              <i className="fas fa-question text-xs"></i>
            </button>
          </div>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Converta sua geração excedente em receita</p>
        </div>

        {/* TUTORIAL EXPANSÍVEL */}
        {showTutorial && (
          <div className="bg-amber-50/50 border border-amber-100 rounded-[2.5rem] p-8 space-y-6 animate-slide-up">
            <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Guia de Consulta de Créditos</h4>
            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-amber-500 shadow-sm shrink-0 border border-amber-100">1</div>
                <div>
                   <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight mb-1">Acesso ao Portal</p>
                   <p className="text-[10px] font-bold text-slate-500 leading-relaxed">Acesse o portal da sua distribuidora (ex: Enel ou CPFL/Bandeirante).</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col items-center">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Energia a Injetar (kWh)</label>
            <input 
              type="number" 
              value={kwhInput}
              onChange={e => setKwhInput(e.target.value)}
              placeholder="0.00"
              className="bg-transparent text-5xl font-black text-slate-800 outline-none w-full text-center placeholder:text-slate-200"
            />
          </div>

          <button 
            onClick={handleInjectEnergy}
            disabled={isProcessing || !kwhInput || estimatedKwh <= 0}
            className="w-full bg-slate-900 text-white h-20 rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isProcessing ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-plug-circle-check"></i>}
            {isProcessing ? 'Sincronizando...' : `Injetar e Gerar R$ ${estimatedRevenue.toFixed(2)}`}
          </button>
        </div>
      </section>

      {/* SALDOS */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-10 rounded-[3.5rem] text-white space-y-8 shadow-xl relative overflow-hidden">
         <div className="grid grid-cols-2 gap-6 relative z-10">
            <div className="space-y-1">
               <p className="text-2xl font-black tracking-tight">R$ {user.balance.toFixed(2)}</p>
               <p className="text-[9px] font-black uppercase text-emerald-300 tracking-widest">Saldo na Carteira</p>
            </div>
            <div className="space-y-1">
               <p className="text-2xl font-black tracking-tight">{metrics.creditsBalance.toFixed(0)}</p>
               <p className="text-[9px] font-black uppercase text-emerald-300 tracking-widest">kWh Disponíveis</p>
            </div>
         </div>
      </section>
    </div>
  );
};

export default ProducerDashboard;
