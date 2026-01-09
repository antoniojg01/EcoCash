import streamlit as st
import streamlit.components.v1 as components
import json
import random
import time
from datetime import datetime
from enum import Enum

# Configuração da página
st.set_page_config(
    page_title="EcoCash - Reciclagem Inteligente",
    page_icon="♻️",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# ENUMS (exatamente como no App.tsx)
class UserRole(Enum):
    RESIDENT = 'MORADOR'
    COLLECTOR = 'COLETOR'
    POINT = 'PONTO'

class RequestStatus(Enum):
    PENDING = 'PENDENTE'
    ACCEPTED = 'ACEITO'
    COLLECTED = 'COLETADO'
    COMPLETED = 'CONCLUÍDO'

# DADOS INICIAIS (exatamente como no App.tsx)
INITIAL_USERS = [
    {"id": "u1", "name": "João Silva", "role": UserRole.RESIDENT, "balance": 42.50},
    {"id": "u2", "name": "Carlos Santos", "role": UserRole.COLLECTOR, "balance": 115.80},
    {"id": "u3", "name": "Ponto Eco-Recicle", "role": UserRole.POINT, "balance": 2500.00}
]

# INICIALIZAÇÃO DO SESSION STATE
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False
if 'current_user' not in st.session_state:
    st.session_state.current_user = None
if 'offers' not in st.session_state:
    st.session_state.offers = []
if 'users' not in st.session_state:
    st.session_state.users = {u["id"]: u for u in INITIAL_USERS}
if 'view' not in st.session_state:
    st.session_state.view = 'home'
if 'sub_tab' not in st.session_state:
    st.session_state.sub_tab = 'available'
if 'active_receipt' not in st.session_state:
    st.session_state.active_receipt = None
if 'show_modal' not in st.session_state:
    st.session_state.show_modal = False
if 'confirmed_weight' not in st.session_state:
    st.session_state.confirmed_weight = {}
if 'loading' not in st.session_state:
    st.session_state.loading = False

# FUNÇÕES (exatamente como no App.tsx)
def login_user(user_id):
    st.session_state.current_user = st.session_state.users[user_id].copy()
    st.session_state.logged_in = True
    st.session_state.view = 'home'
    st.session_state.sub_tab = 'available'
    st.rerun()

def logout_user():
    st.session_state.logged_in = False
    st.session_state.current_user = None
    st.rerun()

def create_offer(description):
    if not description:
        return
    
    st.session_state.loading = True
    time.sleep(1)  # Simula processamento IA
    
    offer_id = f"ECO-{random.randint(1000, 9999)}"
    weight = round(1.5 + random.random() * 4, 1)
    value = round(3.0 + random.random() * 12, 2)
    
    new_offer = {
        "id": offer_id,
        "residentId": st.session_state.current_user["id"],
        "type": description,
        "weight": weight,
        "value": value,
        "status": RequestStatus.PENDING,
        "collectorId": None,
        "actualWeight": None
    }
    
    st.session_state.offers.insert(0, new_offer)
    st.session_state.loading = False
    st.session_state.show_modal = False
    st.rerun()

def accept_offer(offer_id):
    for offer in st.session_state.offers:
        if offer["id"] == offer_id:
            offer["status"] = RequestStatus.ACCEPTED
            offer["collectorId"] = st.session_state.current_user["id"]
            st.rerun()
            break

def collect_offer(offer_id):
    weight_str = st.session_state.confirmed_weight.get(offer_id, "")
    try:
        weight = float(weight_str)
        if weight <= 0:
            st.error("Insira o peso medido.")
            return
    except:
        st.error("Insira o peso medido.")
        return
    
    for offer in st.session_state.offers:
        if offer["id"] == offer_id:
            new_value = (offer["value"] / offer["weight"]) * weight
            offer["status"] = RequestStatus.COLLECTED
            offer["actualWeight"] = weight
            offer["value"] = new_value
            st.session_state.confirmed_weight[offer_id] = ""
            st.session_state.active_receipt = offer.copy()
            st.rerun()
            break

def liquidate_offer(offer_id):
    for offer in st.session_state.offers:
        if offer["id"] == offer_id:
            point_balance = st.session_state.current_user["balance"]
            
            if point_balance < offer["value"]:
                st.error("Saldo insuficiente no Ponto!")
                time.sleep(1)
                st.rerun()
                return
            
            resident_value = offer["value"] * 0.7
            collector_value = offer["value"] * 0.3
            
            # Atualiza saldos
            st.session_state.users[st.session_state.current_user["id"]]["balance"] -= offer["value"]
            st.session_state.users[offer["residentId"]]["balance"] += resident_value
            st.session_state.users[offer["collectorId"]]["balance"] += collector_value
            st.session_state.current_user["balance"] -= offer["value"]
            
            offer["status"] = RequestStatus.COMPLETED
            
            st.success(f"Liquidação efetuada!\n\nMorador: +R$ {resident_value:.2f}\nColetor: +R$ {collector_value:.2f}")
            time.sleep(2)
            st.rerun()
            break

# HTML/CSS completo replicando o design original
html_template = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { 
            font-family: 'Plus Jakarta Sans', sans-serif;
            margin: 0;
            padding: 0;
            -webkit-tap-highlight-color: transparent;
        }
        
        .glass-effect {
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        }
        
        @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        
        .streamlit-button {
            all: unset;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div id="app-container">
        <!-- O conteúdo será injetado aqui via Streamlit -->
        {{CONTENT}}
    </div>
    
    <script>
        function handleAction(action, data) {
            window.parent.postMessage({
                type: 'streamlit:setComponentValue',
                value: {action: action, data: data}
            }, '*');
        }
    </script>
</body>
</html>
"""

def render_login_screen():
    return """
    <div class="h-full flex flex-col items-center justify-center p-6 bg-white overflow-y-auto max-w-[390px] mx-auto w-full shadow-2xl border-x border-slate-100">
        <div class="w-16 h-16 bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center text-3xl shadow-xl mb-5 rotate-3 animate-bounce">
            <i class="fas fa-recycle"></i>
        </div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tighter mb-1">EcoCash</h1>
        <p class="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10">Economia Circular 2.5</p>
        
        <div class="w-full space-y-3">
            <button onclick="handleAction('login', 'u1')" 
                    class="w-full p-4 bg-slate-50 rounded-[1.8rem] flex items-center gap-4 hover:bg-emerald-50 border-2 border-transparent hover:border-emerald-100 transition-all group active:scale-95">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md bg-emerald-500">
                    <i class="fas fa-home text-sm"></i>
                </div>
                <div class="text-left flex-1">
                    <p class="font-black text-slate-900 text-base leading-none mb-1">João Silva</p>
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest">MORADOR</p>
                </div>
                <i class="fas fa-chevron-right text-xs text-slate-200 group-hover:text-emerald-500 transition-colors"></i>
            </button>
            
            <button onclick="handleAction('login', 'u2')" 
                    class="w-full p-4 bg-slate-50 rounded-[1.8rem] flex items-center gap-4 hover:bg-emerald-50 border-2 border-transparent hover:border-emerald-100 transition-all group active:scale-95">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md bg-blue-500">
                    <i class="fas fa-motorcycle text-sm"></i>
                </div>
                <div class="text-left flex-1">
                    <p class="font-black text-slate-900 text-base leading-none mb-1">Carlos Santos</p>
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest">COLETOR</p>
                </div>
                <i class="fas fa-chevron-right text-xs text-slate-200 group-hover:text-emerald-500 transition-colors"></i>
            </button>
            
            <button onclick="handleAction('login', 'u3')" 
                    class="w-full p-4 bg-slate-50 rounded-[1.8rem] flex items-center gap-4 hover:bg-emerald-50 border-2 border-transparent hover:border-emerald-100 transition-all group active:scale-95">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md bg-purple-500">
                    <i class="fas fa-store text-sm"></i>
                </div>
                <div class="text-left flex-1">
                    <p class="font-black text-slate-900 text-base leading-none mb-1">Ponto Eco-Recicle</p>
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest">PONTO</p>
                </div>
                <i class="fas fa-chevron-right text-xs text-slate-200 group-hover:text-emerald-500 transition-colors"></i>
            </button>
        </div>
        
        <div class="mt-10 flex flex-col items-center gap-2">
            <p class="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] flex items-center gap-1.5">
                <i class="fas fa-shield-check text-emerald-500/30"></i> 
                Secure Smart Contracts
            </p>
        </div>
    </div>
    """

# Ocultar elementos do Streamlit
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .block-container {padding: 0 !important; max-width: 100% !important;}
    .main {padding: 0 !important;}
    iframe {border: none !important;}
</style>
""", unsafe_allow_html=True)

# RENDERIZAÇÃO
if not st.session_state.logged_in:
    # Tela de Login
    content = render_login_screen()
    result = components.html(
        html_template.replace("{{CONTENT}}", content),
        height=800,
        scrolling=False
    )
    
    if result:
        if result.get('action') == 'login':
            login_user(result.get('data'))
else:
    # Aplicação principal - usando Streamlit puro com design replicado
    user = st.session_state.current_user
    
    st.markdown(f"""
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        
        * {{
            font-family: 'Plus Jakarta Sans', sans-serif !important;
        }}
        
        .main {{
            background-color: #f8fafc;
            max-width: 390px;
            margin: 0 auto;
            padding: 0;
        }}
        
        .stButton > button {{
            width: 100%;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 900;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.2em;
        }}
    </style>
    
    <div class="flex flex-col h-full bg-slate-50 overflow-hidden max-w-[390px] mx-auto w-full shadow-2xl relative border-x border-slate-200">
        <header class="bg-emerald-600 px-5 pt-10 pb-6 rounded-b-[2rem] shadow-lg flex justify-between items-center shrink-0 z-50">
            <div class="flex flex-col">
                <span class="text-[9px] font-black uppercase text-emerald-200 tracking-widest leading-none mb-1">EcoCash Mobile</span>
                <h1 class="text-lg font-black text-white leading-tight tracking-tight">{user['name'].split()[0]}</h1>
            </div>
            <div class="flex items-center gap-2">
                <div class="bg-white/15 px-2.5 py-1.5 rounded-lg border border-white/20 backdrop-blur-sm">
                    <span class="text-white font-black text-xs">R$ {user['balance']:.2f}</span>
                </div>
            </div>
        </header>
    </div>
    """, unsafe_allow_html=True)
    
    # Botão de logout
    if st.button("🔌", key="logout_top"):
        logout_user()
    
    # Navegação
    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button("🏠 Home", key="nav_home", use_container_width=True):
            st.session_state.view = 'home'
            st.rerun()
    with col2:
        if st.button("🧾 Extrato", key="nav_history", use_container_width=True):
            st.session_state.view = 'history'
            st.rerun()
    with col3:
        if st.button("👤 Perfil", key="nav_profile", use_container_width=True):
            st.session_state.view = 'profile'
            st.rerun()
    
    st.markdown("---")
    
    # CONTEÚDO POR VIEW E ROLE
    if st.session_state.view == 'home':
        if user["role"] == UserRole.RESIDENT:
            st.markdown("### 📦 Vender Material")
            st.caption("IA avalia o preço médio.")
            
            if st.button("➕ NOVO ANÚNCIO", use_container_width=True):
                st.session_state.show_modal = True
                st.rerun()
            
            st.markdown("#### MEUS ANÚNCIOS")
            my_offers = [o for o in st.session_state.offers if o["residentId"] == user["id"]]
            
            if not my_offers:
                st.info("👻 Tudo vazio por aqui")
            else:
                for offer in my_offers:
                    with st.container():
                        col1, col2 = st.columns([3, 1])
                        with col1:
                            st.markdown(f"**{offer['type']}**")
                            st.caption(f"{offer['id']} • {offer['weight']:.1f}kg")
                        with col2:
                            st.markdown(f"**R$ {offer['value']:.2f}**")
                            st.caption(offer['status'].value)
        
        elif user["role"] == UserRole.COLLECTOR:
            st.metric("Coletas do Dia", "12.8 KG", "+2.3kg")
            
            tab1, tab2 = st.tabs(["📍 Disponíveis", "🚚 Minhas Coletas"])
            
            with tab1:
                available = [o for o in st.session_state.offers if o["status"] == RequestStatus.PENDING]
                if not available:
                    st.info("👻 Tudo vazio por aqui")
                else:
                    for offer in available:
                        with st.expander(f"{offer['type']} - R$ {offer['value']:.2f}"):
                            st.caption(f"{offer['weight']:.1f}kg • 1.4km")
                            if st.button("✅ ACEITAR COLETA", key=f"accept_{offer['id']}", use_container_width=True):
                                accept_offer(offer['id'])
            
            with tab2:
                my_cols = [o for o in st.session_state.offers 
                          if o.get("collectorId") == user["id"] and o["status"] != RequestStatus.COMPLETED]
                
                if not my_cols:
                    st.info("👻 Tudo vazio por aqui")
                else:
                    for offer in my_cols:
                        with st.container():
                            st.markdown(f"**{offer['type']}** - {offer['id']}")
                            st.caption(f"Status: {offer['status'].value}")
                            
                            if offer["status"] == RequestStatus.ACCEPTED:
                                weight_key = f"weight_input_{offer['id']}"
                                weight = st.number_input(
                                    "Peso Real (kg)",
                                    min_value=0.1,
                                    value=float(offer['weight']),
                                    step=0.1,
                                    key=weight_key
                                )
                                st.session_state.confirmed_weight[offer['id']] = str(weight)
                                
                                if st.button("📦 COLETAR", key=f"collect_{offer['id']}", use_container_width=True):
                                    collect_offer(offer['id'])
                            
                            elif offer["status"] == RequestStatus.COLLECTED:
                                st.success("✅ Aguardando Validação")
                                if st.button("🧾 VER RECIBO", key=f"receipt_{offer['id']}", use_container_width=True):
                                    st.session_state.active_receipt = offer.copy()
                                    st.rerun()
                            
                            st.markdown("---")
        
        elif user["role"] == UserRole.POINT:
            st.markdown("### 🏪 Terminal de Liquidação")
            st.metric("Saldo Disponível", f"R$ {user['balance']:.2f}")
            
            st.markdown("#### 💳 Coletas para Validar")
            collected = [o for o in st.session_state.offers if o["status"] == RequestStatus.COLLECTED]
            
            if not collected:
                st.info("Nenhuma coleta aguardando validação")
            else:
                for offer in collected:
                    with st.container():
                        st.markdown(f"**{offer['type']}** - {offer['id']}")
                        st.caption(f"{offer['actualWeight']}kg")
                        col1, col2, col3 = st.columns(3)
                        col1.metric("Total", f"R$ {offer['value']:.2f}")
                        col2.metric("Morador", f"R$ {(offer['value']*0.7):.2f}")
                        col3.metric("Coletor", f"R$ {(offer['value']*0.3):.2f}")
                        
                        if st.button("✅ VALIDAR PAGAMENTO", key=f"liquidate_{offer['id']}", use_container_width=True):
                            liquidate_offer(offer['id'])
                        st.markdown("---")
    
    elif st.session_state.view == 'history':
        st.markdown("### 📊 Histórico de Transações")
        completed = [o for o in st.session_state.offers if o["status"] == RequestStatus.COMPLETED]
        
        if not completed:
            st.info("👻 Tudo vazio por aqui")
        else:
            for offer in completed:
                col1, col2 = st.columns([3, 1])
                with col1:
                    st.markdown(f"✅ **{offer['type']}**")
                    st.caption(offer['id'])
                with col2:
                    st.markdown(f"**+R$ {offer['value']:.2f}**")
    
    # MODAL: Novo Anúncio
    if st.session_state.show_modal:
        with st.form("new_offer_form"):
            st.markdown("### 📦 Vender Plástico")
            material_desc = st.text_area(
                "O que você tem?",
                placeholder="Ex: 5 Garrafas PET e 2 Caixas...",
                height=100
            )
            
            col1, col2 = st.columns(2)
            with col1:
                submit = st.form_submit_button("☁️ PUBLICAR AGORA", use_container_width=True)
            with col2:
                cancel = st.form_submit_button("✖ Cancelar", use_container_width=True)
            
            if submit:
                if material_desc:
                    create_offer(material_desc)
                else:
                    st.warning("⚠️ Descreva o material")
            
            if cancel:
                st.session_state.show_modal = False
                st.rerun()
    
    # MODAL: Recibo
    if st.session_state.active_receipt:
        receipt = st.session_state.active_receipt
        with st.container():
            st.markdown("### 🧾 Recibo de Coleta")
            st.markdown(f"**EcoCash Cloud • {receipt['id']}**")
            st.markdown("---")
            st.markdown(f"**MATERIAL:** {receipt['type']}")
            st.markdown(f"**PESO CONFIRMADO:** {receipt['actualWeight']} KG")
            st.markdown(f"**VALOR ESTIMADO:** R$ {receipt['value']:.2f}")
            st.markdown(f"**REPASSE COLETOR:** R$ {(receipt['value']*0.3):.2f}")
            
            col1, col2 = st.columns(2)
            with col1:
                if st.button("📤 COMPARTILHAR", use_container_width=True):
                    st.info("Recibo compartilhado!")
            with col2:
                if st.button("✖ Fechar", use_container_width=True):
                    st.session_state.active_receipt = None
                    st.rerun()
