
import React, { useState } from 'react';
import { User } from '../types';
import { cloud } from '../services/cloudService';

interface ConsumerDashboardProps {
  user: User;
}

const ConsumerDashboard: React.FC<ConsumerDashboardProps> = ({ user }) => {
  const [billValue, setBillValue] = useState('300');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  
  const metrics = user.consumerMetrics;
  const region = user.region || 'Sudeste';

  if (!metrics) return null;

  const distributorPrice = cloud.getDistributorPrice(region);
  const producerPrice = cloud.getProducerPrice(region);
  const estimatedKwh = billValue ? parseFloat(billValue) / distributorPrice : 0;
  
  const platformFeePercent = 0.15;
  const rawP2PCost = estimatedKwh * producerPrice;
  const platformFee = rawP2PCost * platformFeePercent;
  const totalEcoCashCost = rawP2PCost + platformFee;
  const netSavings = billValue ? parseFloat(billValue) - totalEcoCashCost : 0;

  const handleStartPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowPix(true);
    }, 1200);
  };

  const handleConfirmPix = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const result = cloud.autoBuyCredits(user.id, estimatedKwh);
      setIsProcessing(false);
      if (result.success) {
        setPaymentResult(result);
        setShowPix(false);
      } else {
        alert(`Erro: ${result.msg}`);
      }
    }, 2500);
  };

  if (paymentResult) {
    return (
      <div className="space-y-8 animate-fade-in py-10">
        <div className="flex flex-col items-center text-center px-6">
          <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2.8rem] flex items-center justify-center shadow-2xl shadow-emerald-200 mb-6 animate-bounce">
            <i className="fas fa-check text-4xl"></i>
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Fatura Liquidada!</h2>
          <p className="text-sm font-bold text-slate-400 mt-2 px-6">
            Sua conta de luz foi paga utilizando créditos de energia limpa.
          </p>
        </div>
        
        {/* FLOW FINANCEIRO VISUAL */}
        <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="space-y-4">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-sm">
                   <i className="fas fa-user"></i>
                </div>
                <div className="flex-1">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Você Pagou</p>
                   <p className="text-sm font-black text-slate-700">R$ {totalEcoCashCost.toFixed(2)}</p>
                </div>
                <i className="fas fa-arrow-right text-slate-200"></i>
                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-sm">
                   <i className="fas fa-sun"></i>
                </div>
                <div className="flex-1 text-right">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Recebido por</p>
                   <p className="text-sm font-black text-slate-700 truncate">{paymentResult.producerName}</p>
                </div>
             </div>

             <div className="h-[1px] bg-slate-50 w-full"></div>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-4 rounded-3xl text-center">
                   <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Economia Líquida</p>
                   <p className="text-lg font-black text-emerald-600">R$ {paymentResult.savings.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl text-center">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Taxa EcoCash</p>
                   <p className="text-lg font-black text-slate-600">R$ {paymentResult.fee.toFixed(2)}</p>
                </div>
             </div>
          </div>

          <div className="pt-4">
             <div className="bg-slate-900 p-6 rounded-[2.5rem] flex items-center justify-between text-white">
                <div>
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Status da Fatura</p>
                   <p className="text-sm font-black uppercase tracking-widest text-emerald-400">PAGA COM CRÉDITOS</p>
                </div>
                <i className="fas fa-file-invoice-dollar text-2xl text-slate-700"></i>
             </div>
          </div>
        </div>

        <button 
          onClick={() => setPaymentResult(null)}
          className="w-full bg-slate-100 text-slate-500 h-20 rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-sm hover:bg-slate-200 transition-all"
        >
          Fechar Comprovante
        </button>
      </div>
    );
  }

  if (showPix) {
    return (
      <div className="space-y-10 animate-slide-up pb-12">
        <div className="flex items-center justify-between px-2">
           <button onClick={() => setShowPix(false)} className="w-10 h-10 flex items-center justify-center text-slate-400">
             <i className="fas fa-arrow-left"></i>
           </button>
           <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Pagamento Seguro EcoCash</h3>
           <div className="w-10"></div>
        </div>

        <section className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-50 space-y-8 flex flex-col items-center">
          <div className="text-center space-y-1">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Valor do Repasse P2P</p>
            <h2 className="text-4xl font-black text-slate-800">R$ {totalEcoCashCost.toFixed(2)}</h2>
          </div>

          <div className="relative p-4 bg-slate-50 rounded-[2.5rem] border-4 border-white shadow-inner">
             <div className="w-48 h-48 bg-white rounded-2xl flex items-center justify-center text-slate-100 relative overflow-hidden">
                <i className="fas fa-qrcode text-[160px] opacity-10"></i>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <i className="fas fa-bolt"></i>
                   </div>
                </div>
             </div>
          </div>

          <div className="w-full space-y-4">
             <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex-1 truncate pr-4">
                  <p className="text-[8px] font-black text-slate-300 uppercase mb-1">Pix Copia e Cola</p>
                  <p className="text-[10px] font-bold text-slate-500 truncate">00020126580014BR.GOV.BCB.PIX0136ecocash-p2p-{region.toLowerCase()}</p>
                </div>
                <button className="w-10 h-10 bg-white rounded-xl shadow-sm text-blue-500">
                  <i className="fas fa-copy"></i>
                </button>
             </div>
          </div>

          <div className="flex items-center gap-2 text-amber-500 bg-amber-50 px-4 py-2 rounded-full">
            <i className="fas fa-shield-halved text-[10px]"></i>
            <span className="text-[9px] font-black uppercase tracking-widest">Sua Transação está Protegida</span>
          </div>
        </section>

        <div className="space-y-3">
          <button 
            onClick={handleConfirmPix}
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white h-20 rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3"
          >
            {isProcessing ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-shield-check"></i>}
            {isProcessing ? 'Confirmando Transferência...' : 'Confirmar Pagamento'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      {/* STATUS DA FATURA ATUAL */}
      <section className={`${metrics.currentBill.status === 'PAID' ? 'bg-emerald-600' : 'bg-[#0e7490]'} p-10 rounded-[3.5rem] text-white space-y-2 shadow-xl relative overflow-hidden transition-colors`}>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-60">Status da Fatura: {metrics.currentBill.status === 'PAID' ? 'LIQUIDADA' : 'PENDENTE'}</p>
        <h2 className="text-4xl font-black tracking-tighter">
          {metrics.currentBill.status === 'PAID' ? 'R$ 0,00' : `R$ ${parseFloat(billValue).toFixed(2)}`}
          <span className="text-xs font-normal opacity-50 block mt-1 tracking-normal">Referência: {metrics.currentBill.dueDate}</span>
        </h2>
        {metrics.currentBill.status === 'PAID' && (
          <div className="bg-white/20 px-4 py-2 rounded-xl inline-block mt-4">
            <p className="text-[9px] font-black uppercase">Economia de R$ {netSavings.toFixed(2)} Gerada</p>
          </div>
        )}
      </section>

      {metrics.currentBill.status === 'PENDING' ? (
        <section className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-8">
          <div className="text-center">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Liquidadores P2P</h3>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Conectamos você aos produtores da região {region}</p>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex flex-col items-center">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Valor da Conta no Boleto (R$)</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-300">R$</span>
                <input 
                  type="number" 
                  value={billValue}
                  onChange={e => setBillValue(e.target.value)}
                  className="bg-transparent text-4xl font-black text-slate-800 outline-none w-32 text-center"
                />
              </div>
            </div>

            <div className="bg-blue-50/50 p-8 rounded-[3.5rem] border border-blue-100 space-y-6">
               <div className="flex justify-between items-center text-[10px] font-black text-blue-500 uppercase tracking-widest">
                  <span>Simulação de Resgate</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-blue-100">Market Match</span>
               </div>
               
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <p className="text-xs font-bold text-slate-500">Energia Necessária</p>
                     <p className="text-xs font-black text-slate-700">{estimatedKwh.toFixed(1)} kWh</p>
                  </div>
                  <div className="h-[1px] bg-blue-100 w-full opacity-30"></div>
                  <div className="flex justify-between items-center">
                     <p className="text-xs font-bold text-slate-500">Custo via EcoCash (P2P)</p>
                     <p className="text-xs font-black text-slate-700">R$ {totalEcoCashCost.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Economia Real</p>
                     </div>
                     <p className="text-2xl font-black text-emerald-500">R$ {netSavings.toFixed(2)}</p>
                  </div>
               </div>
            </div>

            <button 
              onClick={handleStartPayment}
              disabled={isProcessing || !billValue || estimatedKwh <= 0}
              className="w-full bg-slate-900 text-white h-20 rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isProcessing ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-bolt-lightning"></i>}
              {isProcessing ? 'Localizando Usinas...' : 'Comprar Créditos & Pagar'}
            </button>
          </div>
        </section>
      ) : (
        <section className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-50 text-center space-y-6">
           <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <i className="fas fa-calendar-check text-2xl"></i>
           </div>
           <h3 className="text-xl font-black text-slate-800 tracking-tight">Tudo em dia por aqui!</h3>
           <p className="text-sm font-bold text-slate-400 px-4 leading-relaxed uppercase tracking-wide">Sua próxima fatura de {region} será gerada em breve. Continue acompanhando sua economia.</p>
           <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b-2 border-blue-100 pb-1">Ver Histórico de Pagamentos</button>
        </section>
      )}
    </div>
  );
};

export default ConsumerDashboard;
