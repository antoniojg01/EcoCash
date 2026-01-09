import streamlit as st
import json
from datetime import datetime
from typing import Dict, List
from enum import Enum

# --- CONFIGURAÇÕES ---
st.set_page_config(
    page_title="EcoCash - Economia Circular",
    page_icon="♻️",
    layout="centered",
    initial_sidebar_state="expanded"
)

# --- CSS CUSTOMIZADO ---
st.markdown("""
<style>
    .main {
        background-color: #f8fafc;
    }
    .stButton>button {
        width: 100%;
        border-radius: 12px;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 1px;
        padding: 12px;
        transition: all 0.3s;
    }
    .metric-card {
        background: white;
        padding: 20px;
        border-radius: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        margin: 10px 0;
    }
    .offer-card {
        background: white;
        padding: 16px;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        margin: 10px 0;
    }
    h1 {
        color: #059669;
        font-weight: 900;
    }
    .status-pending {
        background-color: #fef3c7;
        color: #d97706;
        padding: 4px 12px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
    }
    .status-accepted {
        background-color: #dbeafe;
        color: #2563eb;
        padding: 4px 12px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
    }
    .status-collected {
        background-color: #dcfce7;
        color: #059669;
        padding: 4px 12px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
    }
    .status-completed {
        background-color: #d1fae5;
        color: #047857;
        padding: 4px 12px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
    }
</style>
""", unsafe_allow_html=True)

# --- ENUMS & CLASSES ---
class UserRole(Enum):
    RESIDENT = "MORADOR"
    COLLECTOR = "COLETOR"
    POINT = "PONTO"

class RequestStatus(Enum):
    PENDING = "PENDENTE"
    ACCEPTED = "ACEITO"
    COLLECTED = "COLETADO"
    COMPLETED = "CONCLUÍDO"

# --- DADOS INICIAIS ---
INITIAL_USERS = {
    "u1": {"id": "u1", "name": "João Silva", "role": UserRole.RESIDENT, "balance": 42.50},
    "u2": {"id": "u2", "name": "Carlos Santos", "role": UserRole.COLLECTOR, "balance": 115.80},
    "u3": {"id": "u3", "name": "Ponto Eco-Recicle", "role": UserRole.POINT, "balance": 2500.00}
}

# --- INICIALIZAÇÃO DO SESSION STATE ---
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False
if 'current_user' not in st.session_state:
    st.session_state.current_user = None
if 'offers' not in st.session_state:
    st.session_state.offers = []
if 'users' not in st.session_state:
    st.session_state.users = INITIAL_USERS.copy()

# --- FUNÇÕES AUXILIARES ---
def login_user(user_id: str):
    st.session_state.current_user = st.session_state.users[user_id]
    st.session_state.logged_in = True
    st.rerun()

def logout_user():
    st.session_state.logged_in = False
    st.session_state.current_user = None
    st.rerun()

def create_offer(description: str, weight: float, estimated_value: float):
    import random
    offer_id = f"ECO-{random.randint(1000, 9999)}"
    new_offer = {
        "id": offer_id,
        "residentId": st.session_state.current_user["id"],
        "type": description,
        "weight": weight,
        "value": estimated_value,
        "status": RequestStatus.PENDING,
        "collectorId": None,
        "actualWeight": None,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    st.session_state.offers.insert(0, new_offer)
    st.success(f"✅ Anúncio {offer_id} criado com sucesso!")
    st.rerun()

def accept_offer(offer_id: str):
    for offer in st.session_state.offers:
        if offer["id"] == offer_id:
            offer["status"] = RequestStatus.ACCEPTED
            offer["collectorId"] = st.session_state.current_user["id"]
            st.success(f"✅ Coleta {offer_id} aceita!")
            st.rerun()
            break

def collect_offer(offer_id: str, actual_weight: float):
    for offer in st.session_state.offers:
        if offer["id"] == offer_id:
            # Recalcula o valor baseado no peso real
            new_value = (offer["value"] / offer["weight"]) * actual_weight
            offer["status"] = RequestStatus.COLLECTED
            offer["actualWeight"] = actual_weight
            offer["value"] = new_value
            st.success(f"✅ Coleta {offer_id} registrada com peso de {actual_weight}kg!")
            st.rerun()
            break

def liquidate_offer(offer_id: str):
    for offer in st.session_state.offers:
        if offer["id"] == offer_id:
            point_balance = st.session_state.users[st.session_state.current_user["id"]]["balance"]
            
            if point_balance < offer["value"]:
                st.error("❌ Saldo insuficiente no Ponto!")
                return
            
            # Repasse: 70% morador, 30% coletor
            resident_value = offer["value"] * 0.7
            collector_value = offer["value"] * 0.3
            
            # Atualiza saldos
            st.session_state.users[st.session_state.current_user["id"]]["balance"] -= offer["value"]
            st.session_state.users[offer["residentId"]]["balance"] += resident_value
            st.session_state.users[offer["collectorId"]]["balance"] += collector_value
            
            # Marca como completa
            offer["status"] = RequestStatus.COMPLETED
            
            st.success(f"""
            ✅ **Liquidação efetuada!**
            - Morador: +R$ {resident_value:.2f}
            - Coletor: +R$ {collector_value:.2f}
            """)
            st.rerun()
            break

def get_status_class(status: RequestStatus) -> str:
    status_map = {
        RequestStatus.PENDING: "status-pending",
        RequestStatus.ACCEPTED: "status-accepted",
        RequestStatus.COLLECTED: "status-collected",
        RequestStatus.COMPLETED: "status-completed"
    }
    return status_map.get(status, "")

# --- TELA DE LOGIN ---
if not st.session_state.logged_in:
    st.markdown("""
    <div style='text-align: center; padding: 40px 0;'>
        <h1 style='font-size: 48px; margin-bottom: 5px;'>♻️ EcoCash</h1>
        <p style='color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px;'>
            ECONOMIA CIRCULAR 2.5
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("### 🔐 Escolha seu perfil")
    
    for user_id, user in INITIAL_USERS.items():
        role_emoji = {
            UserRole.RESIDENT: "🏠",
            UserRole.COLLECTOR: "🏍️",
            UserRole.POINT: "🏪"
        }
        
        col1, col2 = st.columns([4, 1])
        with col1:
            if st.button(
                f"{role_emoji[user['role']]} {user['name']} - {user['role'].value}",
                key=user_id,
                use_container_width=True
            ):
                login_user(user_id)
        with col2:
            st.markdown(f"**R$ {user['balance']:.2f}**")
    
    st.markdown("---")
    st.markdown("""
    <div style='text-align: center; padding: 20px 0; color: #cbd5e1; font-size: 10px;'>
        🛡️ SECURE SMART CONTRACTS
    </div>
    """, unsafe_allow_html=True)

# --- TELA PRINCIPAL (APÓS LOGIN) ---
else:
    user = st.session_state.current_user
    
    # SIDEBAR
    with st.sidebar:
        st.markdown(f"### 👤 {user['name']}")
        st.markdown(f"**Perfil:** {user['role'].value}")
        st.markdown(f"### 💰 R$ {user['balance']:.2f}")
        st.markdown("---")
        
        if st.button("🚪 Sair", use_container_width=True):
            logout_user()
    
    # HEADER
    st.markdown(f"# ♻️ EcoCash")
    st.markdown(f"**Olá, {user['name'].split()[0]}!** 👋")
    
    # TABS
    tabs = st.tabs(["🏠 Dashboard", "📊 Histórico"])
    
    # --- TAB: DASHBOARD ---
    with tabs[0]:
        # MORADOR
        if user["role"] == UserRole.RESIDENT:
            st.markdown("### 📦 Vender Material")
            
            with st.expander("➕ Criar Novo Anúncio", expanded=False):
                material_desc = st.text_area(
                    "O que você tem?",
                    placeholder="Ex: 5 Garrafas PET e 2 Caixas de leite...",
                    height=100
                )
                
                col1, col2 = st.columns(2)
                with col1:
                    weight = st.number_input("Peso estimado (kg)", min_value=0.1, value=2.0, step=0.1)
                with col2:
                    estimated_value = st.number_input("Valor estimado (R$)", min_value=1.0, value=5.0, step=0.5)
                
                if st.button("📤 Publicar Anúncio", use_container_width=True):
                    if material_desc:
                        create_offer(material_desc, weight, estimated_value)
                    else:
                        st.warning("⚠️ Descreva o material antes de publicar.")
            
            st.markdown("---")
            st.markdown("### 📋 Meus Anúncios")
            
            my_offers = [o for o in st.session_state.offers if o["residentId"] == user["id"]]
            
            if not my_offers:
                st.info("📭 Você ainda não possui anúncios.")
            else:
                for offer in my_offers:
                    with st.container():
                        st.markdown(f"""
                        <div class='offer-card'>
                            <div style='display: flex; justify-content: space-between; align-items: center;'>
                                <div>
                                    <h4 style='margin: 0; font-size: 14px;'>{offer['type']}</h4>
                                    <p style='margin: 5px 0; font-size: 10px; color: #94a3b8; font-weight: 700;'>
                                        {offer['id']} • {offer['weight']:.1f}kg
                                    </p>
                                </div>
                                <div style='text-align: right;'>
                                    <p style='margin: 0; font-size: 16px; font-weight: 900;'>R$ {offer['value']:.2f}</p>
                                    <span class='{get_status_class(offer['status'])}'>{offer['status'].value}</span>
                                </div>
                            </div>
                        </div>
                        """, unsafe_allow_html=True)
        
        # COLETOR
        elif user["role"] == UserRole.COLLECTOR:
            st.markdown("### 🏍️ Central do Coletor")
            
            col1, col2 = st.columns(2)
            with col1:
                st.metric("Coletas do Dia", "12.8 KG", "+2.3 kg")
            with col2:
                st.metric("Ganhos Hoje", "R$ 45.60", "+R$ 8.20")
            
            st.markdown("---")
            
            subtab1, subtab2 = st.tabs(["📍 Disponíveis", "🚚 Minhas Coletas"])
            
            with subtab1:
                available_offers = [o for o in st.session_state.offers if o["status"] == RequestStatus.PENDING]
                
                if not available_offers:
                    st.info("📭 Nenhuma coleta disponível no momento.")
                else:
                    for offer in available_offers:
                        with st.container():
                            col1, col2 = st.columns([3, 1])
                            with col1:
                                st.markdown(f"**{offer['type']}**")
                                st.caption(f"{offer['id']} • {offer['weight']:.1f}kg • ~1.4km")
                            with col2:
                                st.markdown(f"**R$ {offer['value']:.2f}**")
                            
                            if st.button(f"✅ Aceitar", key=f"accept_{offer['id']}", use_container_width=True):
                                accept_offer(offer['id'])
                        st.markdown("---")
            
            with subtab2:
                my_collections = [o for o in st.session_state.offers 
                                 if o.get("collectorId") == user["id"] and o["status"] != RequestStatus.COMPLETED]
                
                if not my_collections:
                    st.info("📭 Você não possui coletas em andamento.")
                else:
                    for offer in my_collections:
                        with st.container():
                            st.markdown(f"**{offer['type']}**")
                            st.caption(f"{offer['id']} • Status: {offer['status'].value}")
                            
                            if offer["status"] == RequestStatus.ACCEPTED:
                                actual_weight = st.number_input(
                                    "Peso Real (kg)",
                                    min_value=0.1,
                                    value=offer['weight'],
                                    step=0.1,
                                    key=f"weight_{offer['id']}"
                                )
                                
                                if st.button(f"📦 Registrar Coleta", key=f"collect_{offer['id']}", use_container_width=True):
                                    collect_offer(offer['id'], actual_weight)
                            
                            elif offer["status"] == RequestStatus.COLLECTED:
                                st.success(f"✅ Coletado: {offer['actualWeight']}kg • Aguardando validação")
                                st.info(f"💰 Você receberá: R$ {(offer['value'] * 0.3):.2f}")
                        
                        st.markdown("---")
        
        # PONTO DE LIQUIDAÇÃO
        elif user["role"] == UserRole.POINT:
            st.markdown("### 🏪 Terminal de Liquidação")
            
            st.metric("Saldo Disponível", f"R$ {user['balance']:.2f}")
            
            st.markdown("---")
            st.markdown("### 💳 Coletas para Validar")
            
            collected_offers = [o for o in st.session_state.offers if o["status"] == RequestStatus.COLLECTED]
            
            if not collected_offers:
                st.info("📭 Nenhuma coleta aguardando validação.")
            else:
                for offer in collected_offers:
                    with st.container():
                        st.markdown(f"**{offer['type']}**")
                        st.caption(f"{offer['id']} • {offer['actualWeight']}kg")
                        
                        col1, col2, col3 = st.columns(3)
                        with col1:
                            st.metric("Valor Total", f"R$ {offer['value']:.2f}")
                        with col2:
                            st.metric("Morador", f"R$ {(offer['value'] * 0.7):.2f}")
                        with col3:
                            st.metric("Coletor", f"R$ {(offer['value'] * 0.3):.2f}")
                        
                        if st.button(f"✅ Validar Pagamento", key=f"liquidate_{offer['id']}", use_container_width=True):
                            liquidate_offer(offer['id'])
                    
                    st.markdown("---")
    
    # --- TAB: HISTÓRICO ---
    with tabs[1]:
        st.markdown("### 📊 Histórico de Transações")
        
        completed_offers = [o for o in st.session_state.offers if o["status"] == RequestStatus.COMPLETED]
        
        if not completed_offers:
            st.info("📭 Nenhuma transação concluída ainda.")
        else:
            for offer in completed_offers:
                with st.container():
                    col1, col2 = st.columns([4, 1])
                    with col1:
                        st.markdown(f"✅ **{offer['type']}**")
                        st.caption(f"{offer['id']} • {offer.get('actualWeight', offer['weight']):.1f}kg")
                    with col2:
                        st.markdown(f"**+R$ {offer['value']:.2f}**")
                st.markdown("---")

# --- FOOTER ---
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: #cbd5e1; font-size: 10px; padding: 20px 0;'>
    🌱 EcoCash Platform • Economia Circular 2.5 • 🛡️ Secure Smart Contracts
</div>
""", unsafe_allow_html=True)
