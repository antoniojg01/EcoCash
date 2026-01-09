import streamlit as st
import streamlit.components.v1 as components
import json
import random
import time

# Configuração da página
st.set_page_config(
    page_title="EcoCash - Reciclagem Inteligente",
    page_icon="♻️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Ocultar elementos Streamlit
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .stDeployButton {display: none;}
    iframe {border: none !important; width: 100% !important; height: 100vh !important;}
    .main {padding: 0 !important;}
    .block-container {padding: 0 !important; max-width: 100% !important;}
</style>
""", unsafe_allow_html=True)

# Inicialização do session state
if 'app_state' not in st.session_state:
    st.session_state.app_state = {
        'users': [
            {"id": "u1", "name": "João Silva", "role": "MORADOR", "balance": 42.50},
            {"id": "u2", "name": "Carlos Santos", "role": "COLETOR", "balance": 115.80},
            {"id": "u3", "name": "Ponto Eco-Recicle", "role": "PONTO", "balance": 2500.00}
        ],
        'offers': [],
        'currentUser': None
    }

# HTML/CSS/JS COMPLETO - Réplica exata do App.tsx
html_content = f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#059669">
    <title>EcoCash Mobile</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body {{ 
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #cbd5e1;
            margin: 0;
            padding: 0;
            -webkit-tap-highlight-color: transparent;
            overflow: hidden;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }}

        #root {{
            height: 100vh;
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            max-width: 390px;
            margin: 0 auto;
        }}

        .glass-effect {{
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        }}

        @keyframes slideUp {{
            from {{ transform: translateY(100%); }}
            to {{ transform: translateY(0); }}
        }}
        .animate-slide-up {{ animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }}

        @keyframes fadeIn {{
            from {{ opacity: 0; }}
            to {{ opacity: 1; }}
        }}
        .animate-fade-in {{ animation: fadeIn 0.3s ease-out; }}
        
        @keyframes bounce {{
            0%, 100% {{ transform: rotate(3deg) translateY(0); }}
            50% {{ transform: rotate(3deg) translateY(-10px); }}
        }}
        .animate-bounce {{ animation: bounce 2s infinite; }}

        .hide-scrollbar {{
            -ms-overflow-style: none;
            scrollbar-width: none;
        }}
        .hide-scrollbar::-webkit-scrollbar {{
            display: none;
        }}
        
        @keyframes spin {{
            from {{ transform: rotate(0deg); }}
            to {{ transform: rotate(360deg); }}
        }}
        .animate-spin {{ animation: spin 1s linear infinite; }}

        @media (min-width: 400px) {{
            #root > div {{
                border-radius: 3rem;
                height: 94vh;
                margin: auto;
            }}
        }}
    </style>
</head>
<body>
    <div id="root"></div>
    
    <script>
        // Estado da aplicação
        let appState = {json.dumps(st.session_state.app_state)};
        let currentUser = null;
        let view = 'home';
        let subTab = 'available';
        let isModalOpen = false;
        let loading = false;
        let confirmedWeight = '';
        let activeReceipt = null;
        
        // Função para salvar estado no Streamlit
        function saveState() {{
            window.parent.postMessage({{
                type: 'streamlit:setComponentValue',
                value: appState
            }}, '*');
        }}
        
        // Função de login
        function handleLogin(userId) {{
            currentUser = appState.users.find(u => u.id === userId);
            render();
        }}
        
        // Função de logout
        function handleLogout() {{
            currentUser = null;
            render();
        }}
        
        // Criar oferta
        function createOffer() {{
            const description = document.getElementById('material-desc').value;
            if (!description) return;
            
            loading = true;
            render();
            
            setTimeout(() => {{
                const newOffer = {{
                    id: `ECO-${{Math.floor(1000 + Math.random() * 9000)}}`,
                    residentId: currentUser.id,
                    type: description,
                    weight: Math.round((1.5 + Math.random() * 4) * 10) / 10,
                    value: Math.round((3.0 + Math.random() * 12) * 100) / 100,
                    status: 'PENDENTE',
                    collectorId: null,
                    actualWeight: null
                }};
                
                appState.offers.unshift(newOffer);
                loading = false;
                isModalOpen = false;
                saveState();
                render();
            }}, 1000);
        }}
        
        // Aceitar coleta
        function acceptOffer(offerId) {{
            const offer = appState.offers.find(o => o.id === offerId);
            if (offer) {{
                offer.status = 'ACEITO';
                offer.collectorId = currentUser.id;
                saveState();
                render();
            }}
        }}
        
        // Coletar
        function collectOffer(offerId) {{
            const weight = parseFloat(confirmedWeight);
            if (isNaN(weight) || weight <= 0) {{
                alert("Insira o peso medido.");
                return;
            }}
            
            const offer = appState.offers.find(o => o.id === offerId);
            if (offer) {{
                const newValue = (offer.value / offer.weight) * weight;
                offer.status = 'COLETADO';
                offer.actualWeight = weight;
                offer.value = newValue;
                confirmedWeight = '';
                activeReceipt = {{ ...offer }};
                saveState();
                render();
            }}
        }}
        
        // Liquidar
        function liquidateOffer(offerId) {{
            const offer = appState.offers.find(o => o.id === offerId);
            if (!offer) return;
            
            const currentUserData = appState.users.find(u => u.id === currentUser.id);
            if (currentUserData.balance < offer.value) {{
                alert("Saldo insuficiente no Ponto!");
                return;
            }}
            
            const resVal = offer.value * 0.7;
            const colVal = offer.value * 0.3;
            
            offer.status = 'CONCLUÍDO';
            currentUserData.balance -= offer.value;
            currentUser.balance = currentUserData.balance;
            
            const resident = appState.users.find(u => u.id === offer.residentId);
            const collector = appState.users.find(u => u.id === offer.collectorId);
            if (resident) resident.balance += resVal;
            if (collector) collector.balance += colVal;
            
            alert(`Liquidação efetuada!\n\nMorador: +R$ ${{resVal.toFixed(2)}}\nColetor: +R$ ${{colVal.toFixed(2)}}`);
            saveState();
            render();
        }}
        
        // Renderização
        function render() {{
            const root = document.getElementById('root');
            
            if (!currentUser) {{
                root.innerHTML = renderLoginScreen();
            }} else {{
                root.innerHTML = renderMainApp();
            }}
        }}
        
        // Tela de login
        function renderLoginScreen() {{
            return `
                <div class="h-full flex flex-col items-center justify-center p-6 bg-white overflow-y-auto max-w-[390px] mx-auto w-full shadow-2xl border-x border-slate-100">
                    <div class="w-16 h-16 bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center text-3xl shadow-xl mb-5 rotate-3 animate-bounce">
                        <i class="fas fa-recycle"></i>
                    </div>
                    <h1 class="text-3xl font-black text-slate-900 tracking-tighter mb-1">EcoCash</h1>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10">Economia Circular 2.5</p>
                    
                    <div class="w-full space-y-3">
                        ${{appState.users.map(u => `
                            <button onclick="handleLogin('${{u.id}}')" 
                                    class="w-full p-4 bg-slate-50 rounded-[1.8rem] flex items-center gap-4 hover:bg-emerald-50 border-2 border-transparent hover:border-emerald-100 transition-all group active:scale-95">
                                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${{u.role === 'MORADOR' ? 'bg-emerald-500' : u.role === 'COLETOR' ? 'bg-blue-500' : 'bg-purple-500'}}">
                                    <i class="fas ${{u.role === 'MORADOR' ? 'fa-home' : u.role === 'COLETOR' ? 'fa-motorcycle' : 'fa-store'}} text-sm"></i>
                                </div>
                                <div class="text-left flex-1">
                                    <p class="font-black text-slate-900 text-base leading-none mb-1">${{u.name}}</p>
                                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest">${{u.role}}</p>
                                </div>
                                <i class="fas fa-chevron-right text-xs text-slate-200 group-hover:text-emerald-500 transition-colors"></i>
                            </button>
                        `).join('')}}
                    </div>
                    
                    <div class="mt-10 flex flex-col items-center gap-2">
                        <p class="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <i class="fas fa-shield-check text-emerald-500/30"></i> 
                            Secure Smart Contracts
                        </p>
                    </div>
                </div>
            `;
        }}
        
        // App principal
        function renderMainApp() {{
            const myOffers = appState.offers.filter(o => o.residentId === currentUser.id);
            const availableOffers = appState.offers.filter(o => o.status === 'PENDENTE');
            const myCollections = appState.offers.filter(o => o.collectorId === currentUser.id && o.status !== 'CONCLUÍDO');
            const collectedOffers = appState.offers.filter(o => o.status === 'COLETADO');
            const completedOffers = appState.offers.filter(o => o.status === 'CONCLUÍDO');
            
            return `
                <div class="flex flex-col h-full bg-slate-50 overflow-hidden max-w-[390px] mx-auto w-full shadow-2xl relative border-x border-slate-200">
                    
                    <!-- HEADER -->
                    <header class="bg-emerald-600 px-5 pt-10 pb-6 rounded-b-[2rem] shadow-lg flex justify-between items-center shrink-0 z-50">
                        <div class="flex flex-col">
                            <span class="text-[9px] font-black uppercase text-emerald-200 tracking-widest leading-none mb-1">EcoCash Mobile</span>
                            <h1 class="text-lg font-black text-white leading-tight tracking-tight">${{currentUser.name.split(' ')[0]}}</h1>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="bg-white/15 px-2.5 py-1.5 rounded-lg border border-white/20 backdrop-blur-sm">
                                <span class="text-white font-black text-xs">R$ ${{currentUser.balance.toFixed(2)}}</span>
                            </div>
                            <button onclick="handleLogout()" class="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-white active:bg-white/20 transition-all">
                                <i class="fas fa-power-off text-sm"></i>
                            </button>
                        </div>
                    </header>
                    
                    <!-- MAIN CONTENT -->
                    <main class="flex-1 overflow-y-auto px-5 pt-5 pb-28 hide-scrollbar">
                        ${{renderContent()}}
                    </main>
                    
                    <!-- FOOTER NAV -->
                    <nav class="glass-effect border-t border-slate-100 absolute bottom-0 left-0 right-0 h-20 px-4 pb-2 flex justify-between items-center z-40">
                        <button onclick="view='home'; render();" class="flex-1 flex flex-col items-center justify-center gap-0.5 group h-full">
                            <div class="w-10 h-9 rounded-xl flex items-center justify-center transition-all ${{view === 'home' ? 'bg-emerald-50 text-emerald-600 shadow-inner' : 'text-slate-300'}}">
                                <i class="fas fa-home ${{view === 'home' ? 'text-base' : 'text-sm'}}"></i>
                            </div>
                            <span class="text-[7px] font-black uppercase tracking-[0.1em] ${{view === 'home' ? 'text-emerald-600' : 'text-slate-400'}}">Dashboard</span>
                        </button>
                        <button onclick="view='history'; render();" class="flex-1 flex flex-col items-center justify-center gap-0.5 group h-full">
                            <div class="w-10 h-9 rounded-xl flex items-center justify-center transition-all ${{view === 'history' ? 'bg-emerald-50 text-emerald-600 shadow-inner' : 'text-slate-300'}}">
                                <i class="fas fa-receipt ${{view === 'history' ? 'text-base' : 'text-sm'}}"></i>
                            </div>
                            <span class="text-[7px] font-black uppercase tracking-[0.1em] ${{view === 'history' ? 'text-emerald-600' : 'text-slate-400'}}">Extrato</span>
                        </button>
                        <button onclick="view='profile'; render();" class="flex-1 flex flex-col items-center justify-center gap-0.5 group h-full">
                            <div class="w-10 h-9 rounded-xl flex items-center justify-center transition-all ${{view === 'profile' ? 'bg-emerald-50 text-emerald-600 shadow-inner' : 'text-slate-300'}}">
                                <i class="fas fa-user-circle ${{view === 'profile' ? 'text-base' : 'text-sm'}}"></i>
                            </div>
                            <span class="text-[7px] font-black uppercase tracking-[0.1em] ${{view === 'profile' ? 'text-emerald-600' : 'text-slate-400'}}">Perfil</span>
                        </button>
                    </nav>
                    
                    ${{isModalOpen ? renderModal() : ''}}
                    ${{activeReceipt ? renderReceipt() : ''}}
                </div>
            `;
        }}
        
        function renderContent() {{
            if (view === 'history') {{
                const completed = appState.offers.filter(o => o.status === 'CONCLUÍDO');
                return `
                    <h4 class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Movimentações</h4>
                    <div class="space-y-2">
                        ${{completed.length === 0 ? '<div class="py-12 text-center"><div class="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto text-slate-200 text-2xl mb-3"><i class="fas fa-ghost"></i></div><p class="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tudo vazio por aqui</p></div>' : completed.map(o => `
                            <div class="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                                <div class="flex items-center gap-3">
                                    <i class="fas fa-check-circle text-emerald-500 text-sm"></i>
                                    <div>
                                        <p class="text-[11px] font-black text-slate-900">${{o.type}}</p>
                                        <p class="text-[9px] font-bold text-slate-400">${{o.id}}</p>
                                    </div>
                                </div>
                                <span class="text-[11px] font-black text-emerald-600">+R$ ${{o.value.toFixed(2)}}</span>
                            </div>
                        `).join('')}}
                    </div>
                `;
            }}
            
            if (currentUser.role === 'MORADOR') {{
                return renderResidentView();
            }} else if (currentUser.role === 'COLETOR') {{
                return renderCollectorView();
            }} else {{
                return renderPointView();
            }}
        }}
        
        function renderResidentView() {{
            const myOffers = appState.offers.filter(o => o.residentId === currentUser.id);
            return `
                <div class="bg-white p-5 rounded-[1.8rem] shadow-sm border border-slate-100 space-y-3 text-center mb-5">
                    <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-lg mx-auto">
                        <i class="fas fa-plus"></i>
                    </div>
                    <div>
                        <h3 class="font-black text-slate-900 text-sm">Vender material</h3>
                        <p class="text-[10px] text-slate-400 font-medium">IA avalia o preço médio.</p>
                    </div>
                    <button onclick="isModalOpen=true; render();" class="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all">Novo Anúncio</button>
                </div>
                <h4 class="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Meus Anúncios</h4>
                <div class="space-y-3">
                    ${{myOffers.length === 0 ? '<div class="py-12 text-center"><div class="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto text-slate-200 text-2xl mb-3"><i class="fas fa-ghost"></i></div><p class="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tudo vazio por aqui</p></div>' : myOffers.map(o => renderOfferCard(o)).join('')}}
                </div>
            `;
        }}
        
        function renderCollectorView() {{
            const available = appState.offers.filter(o => o.status === 'PENDENTE');
            const myCollections = appState.offers.filter(o => o.collectorId === currentUser.id && o.status !== 'CONCLUÍDO');
            
            return `
                <div class="bg-blue-600 p-5 rounded-[1.8rem] shadow-lg text-white flex justify-between items-center mb-4">
                    <div>
                        <p class="text-[9px] font-black uppercase opacity-60 tracking-widest">Coletas do Dia</p>
                        <h3 class="text-xl font-black">12.8 KG</h3>
                    </div>
                    <i class="fas fa-motorcycle text-2xl opacity-30"></i>
                </div>
                
                <div class="flex bg-slate-200/50 p-1 rounded-xl mb-4">
                    <button onclick="subTab='available'; render();" class="flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${{subTab === 'available' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}}">Disponíveis</button>
                    <button onclick="subTab='ongoing'; render();" class="flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${{subTab === 'ongoing' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}}">Minhas Coletas</button>
                </div>
                
                <div class="space-y-3">
                    ${{subTab === 'available' ? (available.length === 0 ? '<div class="py-12 text-center"><div class="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto text-slate-200 text-2xl mb-3"><i class="fas fa-ghost"></i></div><p class="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tudo vazio por aqui</p></div>' : available.map(o => `
                        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                            <div class="flex justify-between items-start">
                                <div>
                                    <p class="font-black text-slate-900 text-[13px]">${{o.type}}</p>
                                    <p class="text-[10px] text-slate-400 font-bold">${{o.weight.toFixed(1)}}kg • 1.4km</p>
                                </div>
                                <span class="text-emerald-600 font-black text-sm">R$ ${{o.value.toFixed(2)}}</span>
                            </div>
                            <button onclick="acceptOffer('${{o.id}}')" class="w-full bg-blue-600 text-white py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest active:bg-blue-700">Aceitar Coleta</button>
                        </div>
                    `).join('')) : (myCollections.length === 0 ? '<div class="py-12 text-center"><div class="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto text-slate-200 text-2xl mb-3"><i class="fas fa-ghost"></i></div><p class="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tudo vazio por aqui</p></div>' : myCollections.map(o => renderCollectionCard(o)).join(''))}}
                </div>
            `;
        }}
        
        function renderPointView() {{
            const collected = appState.offers.filter(o => o.status === 'COLETADO');
            return `
                <div class="bg-purple-600 p-5 rounded-[1.8rem] shadow-lg text-white mb-5">
                    <p class="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Ponto de Liquidação</p>
                    <h3 class="text-xl font-black">Terminal Ativo</h3>
                </div>
                
                <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h4 class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Coletas para Liquidar</h4>
                    <div class="space-y-3">
                        ${{collected.length === 0 ? '<p class="text-[10px] font-black text-slate-300 text-center py-8">Nenhuma coleta aguardando validação</p>' : collected.map(o => `
                            <div class="bg-slate-50 p-4 rounded-2xl flex flex-col gap-3">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <p class="font-black text-slate-900 text-[13px]">${{o.type}}</p>
                                        <p class="text-[9px] font-bold text-slate-400 uppercase">${{o.id}} • ${{o.actualWeight}}kg</p>
                                    </div>
                                    <p class="text-sm font-black text-slate-900">R$ ${{o.value.toFixed(2)}}</p>
                                </div>
                                <button onclick="liquidateOffer('${{o.id}}')" class="w-full bg-purple-600 text-white py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest active:bg-purple-700">Validar Pagamento</button>
                            </div>
                        `).join('')}}
                    </div>
                </div>
            `;
        }}
        
        function renderOfferCard(o) {{
            const statusIcons = {{
                'PENDENTE': 'fa-hourglass-start',
                'ACEITO': 'fa-truck-loading',
                'COLETADO': 'fa-check-double',
                'CONCLUÍDO': 'fa-check-double'
            }};
            const statusColors = {{
                'PENDENTE': 'bg-amber-50 text-amber-500',
                'ACEITO': 'bg-blue-50 text-blue-500',
                'COLETADO': 'bg-emerald-100 text-emerald-600',
                'CONCLUÍDO': 'bg-emerald-100 text-emerald-600'
            }};
            const statusTextColors = {{
                'PENDENTE': 'text-amber-500',
                'ACEITO': 'text-blue-500',
                'COLETADO': 'text-emerald-600',
                'CONCLUÍDO': 'text-emerald-600'
            }};
            
            return `
                <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 transition-transform active:scale-[0.98]">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center text-base ${{statusColors[o.status]}}">
                        <i class="fas ${{statusIcons[o.status]}}"></i>
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <h5 class="font-black text-slate-900 text-[13px] leading-tight truncate">${{o.type}}</h5>
                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">${{o.id}} • ${{o.weight.toFixed(1)}}kg</p>
                    </div>
                    <div class="text-right shrink-0">
                        <p class="text-xs font-black text-slate-900">R$ ${{o.value.toFixed(2)}}</p>
                        <p class="text-[7px] font-black uppercase tracking-widest ${{statusTextColors[o.status]}}">${{o.status}}</p>
                    </div>
                </div>
            `;
        }}
        
        function renderCollectionCard(o) {{
            const borderClass = o.status === 'COLETADO' ? 'border-emerald-500' : 'border-blue-200';
            return `
                <div class="bg-white p-4 rounded-2xl border-2 shadow-sm flex flex-col gap-3 transition-all ${{borderClass}}">
                    <div class="flex justify-between items-center">
                        <span class="text-[9px] font-black text-blue-500 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded-md">${{o.id}}</span>
                        <span class="text-[9px] font-black text-slate-400 uppercase">${{o.status}}</span>
                    </div>
                    <p class="font-black text-slate-900 text-sm">${{o.type}}</p>
                    ${{o.status === 'ACEITO' ? `
                        <div class="flex gap-2">
                            <input type="number" placeholder="Peso Real" value="${{confirmedWeight}}" oninput="confirmedWeight=this.value" 
                                   class="flex-1 bg-slate-50 border border-slate-100 p-2 rounded-lg text-xs font-black outline-none focus:border-blue-500">
                            <button onclick="collectOffer('${{o.id}}')" class="bg-emerald-600 text-white px-4 rounded-lg text-[9px] font-black uppercase">Coletar</button>
                        </div>
                    ` : ''}}
                    ${{o.status === 'COLETADO' ? `
                        <div class="space-y-2">
                            <p class="text-[10px] font-bold text-emerald-600 uppercase text-center py-1 bg-emerald-50 rounded-lg">Aguardando Validação</p>
                            <button onclick="activeReceipt=${{JSON.stringify(o)}}; render();" class="w-full bg-slate-100 text-slate-600 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                <i class="fas fa-receipt"></i> Ver Recibo Digital
                            </button>
                        </div>
                    ` : ''}}
                </div>
            `;
        }}
        
        function renderModal() {{
            return `
                <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-fade-in" onclick="if(event.target===this){{isModalOpen=false; render();}}">
                    <div class="bg-white w-full max-w-[320px] rounded-[2.5rem] p-6 animate-slide-up">
                        <div class="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6"></div>
                        <div class="flex justify-between items-center mb-5">
                            <h2 class="text-xl font-black text-slate-900">Vender Plástico</h2>
                            <button onclick="isModalOpen=false; render();" class="w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="space-y-5">
                            <div class="space-y-1.5">
                                <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">O que você tem?</label>
                                <textarea id="material-desc" placeholder="Ex: 5 Garrafas PET e 2 Caixas..." 
                                          class="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl h-28 outline-none focus:border-emerald-500 font-bold transition-all text-sm text-slate-900 resize-none"></textarea>
                            </div>
                            <button onclick="createOffer()" ${{loading ? 'disabled' : ''}} 
                                    class="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                                ${{loading ? '<i class="fas fa-spinner animate-spin"></i> Calculando Preço...' : '<i class="fas fa-cloud-upload-alt"></i> Publicar Agora'}}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }}
        
        function renderReceipt() {{
            return `
                <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-fade-in" onclick="if(event.target===this){{activeReceipt=null; render();}}">
                    <div class="bg-white w-full max-w-[320px] rounded-[2rem] overflow-hidden shadow-2xl animate-slide-up flex flex-col">
                        <div class="bg-emerald-600 p-6 text-center text-white space-y-2">
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <i class="fas fa-receipt text-xl"></i>
                            </div>
                            <h3 class="font-black uppercase tracking-widest text-sm">Recibo de Coleta</h3>
                            <p class="text-[10px] font-bold opacity-70">EcoCash Cloud • ${{activeReceipt.id}}</p>
                        </div>
                        
                        <div class="p-6 space-y-6">
                            <div class="space-y-3 font-mono text-[11px] border-b border-dashed border-slate-100 pb-5">
                                <div class="flex justify-between">
                                    <span class="text-slate-400">MATERIAL:</span>
                                    <span class="font-black text-slate-900">${{activeReceipt.type}}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-slate-400">PESO CONFIRMADO:</span>
                                    <span class="font-black text-slate-900">${{activeReceipt.actualWeight}} KG</span>
                                </div>
                                <div class="flex justify-between border-t border-slate-50 pt-3">
                                    <span class="text-slate-400">VALOR ESTIMADO:</span>
                                    <span class="font-black text-emerald-600">R$ ${{activeReceipt.value.toFixed(2)}}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-slate-400">REPASSE COLETOR:</span>
                                    <span class="font-black text-blue-600">R$ ${{(activeReceipt.value * 0.3).toFixed(2)}}</span>
                                </div>
                            </div>
                            
                            <div class="space-y-3">
                                <button onclick="alert('Recibo compartilhado!')" class="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                                    <i class="fas fa-share-alt"></i> Compartilhar
                                </button>
                                <button onclick="window.print()" class="w-full border-2 border-slate-100 text-slate-400 py-3.5 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2">
                                    <i class="fas fa-download"></i> Baixar PDF
                                </button>
                                <button onclick="activeReceipt=null; render();" class="w-full py-2 text-slate-300 font-black uppercase text-[8px] tracking-[0.2em]">
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }}
        
        // Inicialização
        render();
    </script>
</body>
</html>
"""

# Renderizar aplicação
result = components.html(html_content, height=900, scrolling=False)

# Atualizar estado quando houver mudanças
if result:
    st.session_state.app_state = result
