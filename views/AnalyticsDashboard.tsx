
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { cloud } from '../services/cloudService';

interface AnalyticsDashboardProps {
  user: User;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ user }) => {
  const [billValue, setBillValue] = useState('');
  const [barcode, setBarcode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const [pixStep, setPixStep] = useState<1 | 2>(1);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const analytics = cloud.getMarketAnalytics();
  const region = user.region || 'Sudeste';
  
  const producerPrice = cloud.getProducerPrice(region);
  const distributorPrice = cloud.getDistributorPrice(region);
  
  const val = parseFloat(billValue) || 0;
  const estimatedKwh = val / distributorPrice;
  const platformFeePercent = 0.10;
  const totalEcoCashCost = (estimatedKwh * producerPrice) / (1 - platformFeePercent);
  const platformFee = totalEcoCashCost * platformFeePercent;
  const recipientAmount = totalEcoCashCost - platformFee;
  const netSavings = val > 0 ? val - totalEcoCashCost : 0;

  const handleStartPayment = () => {
    if (val <= 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowPix(true);
      setPixStep(1);
    }, 1000);
  };

  const startScanner = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      // Simulação de leitura após 3 segundos
      setTimeout(() => {
        stopScanner();
        setBillValue('450.00');
        setBarcode('00190.00009 02345.678901 23456.789012 8 12340000045000');
        alert("Código detectado com sucesso!");
      }, 3000);
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      setIsScanning(false);
      alert("Não foi possível acessar a câmera para escanear.");
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const handleNextPixStep = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPixStep(2);
    }, 1200);
  };

  const handleFinalize = async () => {
    setIsProcessing(true);
    setTimeout(async () => {
      await cloud.autoBuyCredits(user.id, estimatedKwh);
      setIsProcessing(false);
      setShowPix(false);
      setPaymentSuccess(true);
      setBillValue('');
      setBarcode('');
    }, 2000);
  };

  if (paymentSuccess) {
    return (
      <div className="space-y-8 animate-fade-in py-10 flex flex-col items-center">
        <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl animate-bounce mb-6">
          <i className="fas fa-check text-3xl"></i>
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pagamento Concluído!</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Sua economia foi processada via P2P</p>
        <button 
          onClick={() => setPaymentSuccess(false)}
          className="mt-8 w-full bg-slate-100 text-slate-500 h-16 rounded-full font-black text-[10px] uppercase tracking-widest"
        >
          Voltar ao Mercado
        </button>
      </div>
    );
  }

  if (showPix) {
    return (
      <div className="space-y-8 animate-slide-up pb-12">
        <div className="flex items-center justify-between px-2">
           <button onClick={() => setShowPix(false)} className="w-10 h-10 flex items-center justify-center text-slate-400">
             <i className="fas fa-arrow-left"></i>
           </button>
           <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Checkout Energético {pixStep}/2</h3>
           <div className="w-10"></div>
        </div>

        <section className={`bg-white p-10 rounded-[3.5rem] shadow-xl border-2 transition-all ${pixStep === 1 ? 'border-blue-100' : 'border-emerald-100'} flex flex-col items-center gap-6`}>
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Valor do {pixStep === 1 ? 'PIX de Taxa' : 'PIX de Energia'}</p>
            <h2 className={`text-4xl font-black ${pixStep === 1 ? 'text-blue-600' : 'text-emerald-600'}`}>
              R$ {pixStep === 1 ? platformFee.toFixed(2) : recipientAmount.toFixed(2)}
            </h2>
          </div>
          
          <div className="w-40 h-40 bg-slate-50 rounded-3xl flex items-center justify-center border-4 border-white shadow-inner">
             <i className={`fas ${pixStep === 1 ? 'fa-shield-halved text-blue-100' : 'fa-sun text-emerald-100'} text-7xl`}></i>
          </div>

          <button className="w-full h-12 bg-slate-50 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-slate-100 flex items-center justify-center gap-2">
             <i className="fas fa-copy"></i> Copiar Código PIX
          </button>
        </section>

        <button 
          onClick={handleNextPixStep}
          disabled={isProcessing}
          className={`w-full h-20 rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all ${pixStep === 1 ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}
        >
          {isProcessing ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-check-double"></i>}
          {isProcessing ? 'Validando...' : pixStep === 1 ? 'Próxima Etapa (Energia)' : 'Finalizar Liquidação'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* SCANNER OVERLAY */}
      {isScanning && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-0 border-[40px] border-black/60 pointer-events-none">
            <div className="w-full h-full border-2 border-emerald-500 rounded-2xl relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-500/50 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
            </div>
          </div>
          <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-6 px-10">
            <p className="text-white font-black text-[11px] uppercase tracking-[0.3em] text-center bg-black/40 px-6 py-2 rounded-full backdrop-blur-md">Aponte para o Código de Barras ou QR</p>
            <button onClick={stopScanner} className="w-16 h-16 bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-xl border border-white/20">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>
      )}

      {/* FUNÇÃO DE INSERIR CONTA (MELHORADA) */}
      <section className="bg-white p-8 rounded-[4rem] border border-slate-100 shadow-xl space-y-10 animate-slide-up relative overflow-hidden mt-6 mb-12">
        <div className="text-center space-y-1">
           <h3 className="text-2xl font-black text-slate-900 tracking-tight">Liquidar Fatura</h3>
        </div>

        <div className="space-y-8">
           {/* CAMPO DO VALOR - ULTRA VISÍVEL E SEM SOBREPOSIÇÃO */}
           <div className="relative group">
              <div className="bg-slate-50/80 p-8 rounded-[3rem] border-2 border-slate-100 flex flex-col items-center transition-all group-focus-within:border-emerald-500 group-focus-within:bg-white group-focus-within:shadow-2xl group-focus-within:shadow-emerald-100 group-focus-within:-translate-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Valor Total da Fatura (R$)</label>
                 <div className="flex items-center justify-center gap-3 w-full">
                   <span className="text-4xl font-black text-emerald-600/30 shrink-0">R$</span>
                   <input 
                     type="number" 
                     value={billValue}
                     onChange={e => setBillValue(e.target.value)}
                     placeholder="0.00"
                     className="bg-transparent text-5xl font-black text-slate-900 outline-none w-full max-w-[180px] text-left placeholder:text-slate-100 caret-emerald-500"
                   />
                 </div>
              </div>
              <button 
                onClick={startScanner}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-emerald-600 text-white rounded-[1.8rem] shadow-xl shadow-emerald-200 active:scale-90 transition-all flex items-center justify-center hover:bg-emerald-700 z-10"
              >
                <i className="fas fa-camera text-xl"></i>
              </button>
           </div>

           {/* CAMPO DO CÓDIGO DE BARRAS - CORRIGINDO VISIBILIDADE (NÃO APAGADO) */}
           <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-6">Código de Barras / Linha Digitável</label>
              <div className="relative">
                <input 
                  type="text"
                  value={barcode}
                  onChange={e => setBarcode(e.target.value)}
                  placeholder="00000.00000 00000.000000..."
                  className="w-full bg-white p-6 rounded-[2rem] font-bold text-sm outline-none border-2 border-slate-100 focus:border-blue-400 text-slate-700 transition-all placeholder:text-slate-300 shadow-inner"
                />
                <i className="fas fa-barcode absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 text-lg"></i>
              </div>
           </div>

           {val > 0 && (
             <div className="bg-blue-50/50 p-8 rounded-[3rem] border border-blue-100 space-y-6 animate-slide-up shadow-inner">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-blue-500">
                   <span className="flex items-center gap-2"><i className="fas fa-calculator"></i> Simulação de Resgate</span>
                   <span className="bg-white px-3 py-1 rounded-full shadow-sm text-[9px]">Region: {region}</span>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-center px-2">
                      <span className="text-xs font-bold text-slate-500">Energia Necessária</span>
                      <span className="text-sm font-black text-slate-700">{estimatedKwh.toFixed(1)} kWh</span>
                   </div>
                   <div className="h-[1px] bg-blue-100 opacity-50"></div>
                   <div className="flex justify-between items-center px-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Economia Líquida</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Spread P2P</span>
                      </div>
                      <span className="text-2xl font-black text-emerald-600">R$ {netSavings.toFixed(2)}</span>
                   </div>
                </div>
             </div>
           )}

           <button 
             onClick={handleStartPayment}
             disabled={val <= 0 || isProcessing}
             className="w-full bg-slate-900 text-white h-24 rounded-full font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl shadow-slate-200 active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-4 group transition-all"
           >
             {isProcessing ? (
               <i className="fas fa-circle-notch animate-spin"></i>
             ) : (
               <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                 <i className="fas fa-bolt-lightning text-white text-sm"></i>
               </div>
             )}
             {isProcessing ? 'Sincronizando Nodes...' : 'Pagar e Gerar Economia'}
           </button>
        </div>
      </section>

      {/* HEATMAP REGIONAL */}
      <section className="space-y-5 px-2">
         <div className="flex justify-between items-center px-4">
           <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Preço Médio Regional (kWh)</h3>
           <i className="fas fa-map-location-dot text-slate-200"></i>
         </div>
         <div className="grid grid-cols-1 gap-4">
            {analytics.regionStats.map((stat, i) => (
               <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-500 font-black text-xs border border-slate-100">
                        {stat.region.substring(0, 2).toUpperCase()}
                     </div>
                     <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{stat.region}</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stat.count} Produtores</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-base font-black text-slate-700">R$ {stat.avgPrice.toFixed(2)}</p>
                     <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden ml-auto">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${Math.min((stat.totalKwh / 1000) * 100, 100)}%` }}
                        ></div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* AÇÕES DE EXPORTAÇÃO */}
      <section className="px-2 pb-6">
         <button className="w-full bg-blue-600 text-white h-20 rounded-full font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
            <i className="fas fa-file-invoice-dollar"></i>
            Exportar Relatório Mensal
         </button>
      </section>
    </div>
  );
};

export default AnalyticsDashboard;
