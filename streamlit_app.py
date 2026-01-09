import streamlit as st
import json
import random
import time
from datetime import datetime
from enum import Enum
import os

# Configuração da página
st.set_page_config(
    page_title="EcoCash Mobile",
    page_icon="♻️",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# CSS EXATO DO DESIGN ORIGINAL
st.markdown("""
<style>
    /* Reset e configurações globais */
    .main {
        padding: 0 !important;
        max-width: 390px !important;
        margin: 0 auto !important;
    }
    
    .block-container {
        padding: 0 !important;
        max-width: 390px !important;
    }
    
    [data-testid="stAppViewContainer"] {
        background-color: #f8fafc;
    }
    
    /* Ocultar elementos do Streamlit */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    
    /* Scrollbar customizada */
    ::-webkit-scrollbar {
        width: 0px;
        display: none;
    }
    
    /* Header estilo original */
    .eco-header {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        padding: 2.5rem 1.25rem 1.5rem;
        border-radius: 0 0 2rem 2rem;
        box-shadow: 0 10px 25px rgba(5, 150, 105, 0.2);
        margin-bottom: 1.25rem;
    }
    
    .eco-header-title {
        font-size: 9px;
        font-weight: 900;
        color: #a7f3d0;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        margin-bottom: 0.25rem;
    }
    
    .eco-header-name {
        font-size: 1.125rem;
        font-weight: 900;
        color: white;
        letter-spacing: -0.025em;
    }
    
    .eco-balance {
        background: rgba(255, 255, 255, 0.15);
        padding: 0.375rem 0.625rem;
        border-radius: 0.5rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        display: inline-block;
    }
    
    .eco-balance-value {
        color: white;
        font-weight: 900;
        font-size: 0.75rem;
    }
    
    /* Cards */
    .card-white {
        background: white;
        padding: 1.25rem;
        border-radius: 1.8rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        border: 1px solid #f1f5f9;
        margin: 0.625rem 0;
    }
    
    .card-icon {
        width: 3rem;
        height: 3rem;
        background: #f0fdf4;
        color: #059669;
        border-radius: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.125rem;
        margin: 0 auto 0.75rem;
    }
    
    /* Offer Card */
    .offer-card {
        background: white;
        padding: 1rem;
        border-radius: 1rem;
        border: 1px solid #e2e8f0;
        margin: 0.75rem 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .offer-icon {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        flex-shrink: 0;
    }
    
    .offer-pending { background: #fef3c7; color: #d97706; }
    .offer-accepted { background: #dbeafe; color: #2563eb; }
    .offer-collected { background: #dcfce7; color: #059669; }
    .offer-completed { background: #d1fae5; color: #047857; }
    
    .offer-title {
        font-weight: 900;
        color: #0f172a;
        font-size: 0.8125rem;
        line-height: 1.2;
        margin: 0;
    }
    
    .offer-id {
        font-size: 9px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0.125rem 0 0;
    }
    
    .offer-value {
        font-size: 0.75rem;
        font-weight: 900;
        color: #0f172a;
        text-align: right;
        margin: 0;
    }
    
    .offer-status {
        font-size: 7px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        text-align: right;
        margin: 0.125rem 0 0;
    }
    
    .status-pending { color: #d97706; }
    .status-accepted { color: #2563eb; }
    .status-collected { color: #059669; }
    .status-completed { color: #047857; }
    
    /* Botões */
    .stButton > button {
        width: 100%;
        background: #0f172a;
        color: white;
        padding: 0.875rem;
        border-radius: 0.75rem;
        font-weight: 900;
        text-transform: uppercase;
        font-size: 9px;
        letter-spacing: 0.2em;
        border: none;
        transition: all 0.3s;
    }
    
    .stButton > button:hover {
        transform: scale(0.98);
        background: #1e293b;
    }
    
    /* Input fields */
    .stTextArea textarea, .stTextInput input, .stNumberInput input {
        background: #f8fafc;
        border: 2px solid #f1f5f9;
        border-radius: 1rem;
        padding: 1rem;
        font-weight: 700;
        font-size: 0.875rem;
        color: #0f172a;
    }
    
    .stTextArea textarea:focus, .stTextInput input:focus, .stNumberInput input:focus {
        border-color: #059669;
        box-shadow: 0 0 0 1px #059669;
    }
    
    /* Section headers */
    .section-header {
        font-size: 9px;
        font-weight: 900;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        padding: 0 0.25rem;
        margin: 1.25rem 0 0.625rem;
    }
    
    /* Empty state */
    .empty-state {
        padding: 3rem 0;
        text-align: center;
    }
    
    .empty-icon {
        width: 4rem;
        height: 4rem;
        background: #f8fafc;
        border-radius: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 0.75rem;
        color: #e2e8f0;
        font-size: 1.5rem;
    }
    
    .empty-text {
        font-size: 9px;
        font-weight: 900;
        color: #cbd5e1;
        text-transform: uppercase;
        letter-spacing: 0.2em;
    }
    
    /* Tab buttons */
    .tab-container {
        background: rgba(226, 232, 240, 0.5);
        padding: 0.25rem;
        border-radius: 0.75rem;
        margin: 1rem 0;
        display: flex;
        gap: 0.25rem;
    }
    
    /* Loading spinner */
    .spinner {
        display: inline-block;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Collector stats */
    .stat-card {
        background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
        padding: 1.25rem;
        border-radius: 1.8rem;
        box-shadow: 0 10px 25px rgba(37, 99, 235, 0.2);
        color: white;
        margin-bottom: 1rem;
    }
    
    .stat-label {
        font-size: 9px;
        font-weight: 900;
        opacity: 0.6;
        text-transform: uppercase;
        letter-spacing: 0.2em;
    }
    
    .stat-value {
        font-size: 1.25rem;
        font-weight: 900;
        margin-top: 0.25rem;
    }
    
    /* Point terminal */
    .point-header {
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        padding: 1.25rem;
        border-radius: 1.8rem;
        box-shadow: 0 10px 25px rgba(124, 58, 237, 0.2);
        color: white;
        margin-bottom: 1.25rem;
    }
    
    /* Receipt modal */
    .receipt-modal {
        background: white;
        border-radius: 2rem;
        overflow: hidden;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
        max-width: 320px;
        margin: 0 auto;
    }
    
    .receipt-header {
        background: #059669;
        padding: 1.5rem;
        text-align: center;
        color: white;
    }
    
    .receipt-icon {
        width: 3rem;
        height: 3rem;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 0.5rem;
        font-size: 1.25rem;
    }
    
    .receipt-title {
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        font-size: 0.875rem;
    }
    
    .receipt-body {
        padding: 1.5rem;
    }
    
    .receipt-line {
        display: flex;
        justify-content: space-between;
        font-family: monospace;
        font-size: 0.6875rem;
        margin: 0.75rem 0;
    }
    
    .receipt-label {
        color: #94a3b8;
    }
    
    .receipt-value {
        font-weight: 900;
        color: #0f172a;
    }
</style>
""", unsafe_allow_html=True)

# ENUMS
class UserRole(Enum):
    RESIDENT = 'MORADOR'
    COLLECTOR = 'COLETOR'
    POINT = 'PONTO'

class RequestStatus(Enum):
    PENDING = 'PENDENTE'
    ACCEPTED = 'ACEITO'
    COLLECTED = 'COLETADO'
    COMPLETED = 'CONCLUÍDO'

# DADOS INICIAIS
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

# FUNÇÕES
def login_user(user_id):
    st.session_state.current_user = st.session_state.users[user_id]
    st.session_state.logged_in = True
    st.session_state.view = 'home'
    st.rerun()

def logout_user():
    st.session_state.logged_in = False
    st.session_state.current_user = None
    st.rerun()

def create_offer(description, weight, value):
    offer_id = f"ECO-{random.randint(1000, 9999)}"
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
    st.session_state.show_modal = False
    st.rerun()

def accept_offer(offer_id):
    for offer in st.session_state.offers:
        if offer["id"] == offer_id:
            offer["status"] = RequestStatus.ACCEPTED
            offer["collectorId"] = st.session_state.current_user["id"]
            st.rerun()
            break

def collect_offer(offer_id, actual_weight):
    for offer in st.session_state.offers:
        if offer["id"] == offer_id:
            new_value = (offer["value"] / offer["weight"]) * actual_weight
            offer["status"] = RequestStatus.COLLECTED
            offer["actualWeight"] = actual_weight
            offer["value"] = new_value
            st.session_state.active_receipt = offer
            st.rerun()
            break

def liquidate_offer(offer_id):
    for offer in st.session_state.offers:
        if offer["id"] == offer_id:
            point_balance = st.session_state.current_user["balance"]
            
            if point_balance < offer["value"]:
                st.error("❌ Saldo insuficiente no Ponto!")
                return
            
            resident_value = offer["value"] * 0.7
            collector_value = offer["value"] * 0.3
            
            st.session_state.users[st.session_state.current_user["id"]]["balance"] -= offer["value"]
            st.session_state.users[offer["residentId"]]["balance"] += resident_value
            st.session_state.users[offer["collectorId"]]["balance"] += collector_value
            st.session_state.current_user["balance"] -= offer["value"]
            
            offer["status"] = RequestStatus.COMPLETED
            
            st.success(f"✅ Liquidação efetuada!\n\nMorador: +R$ {resident_value:.2f}\nColetor: +R$ {collector_value:.2f}")
            time.sleep(2)
            st.rerun()
            break

def get_status_icon(status):
    icons = {
        RequestStatus.PENDING: "⏳",
        RequestStatus.ACCEPTED: "🚚",
        RequestStatus.COLLECTED: "✅",
        RequestStatus.COMPLETED: "✔️"
    }
    return icons.get(status, "")

def get_status_class(status):
    classes = {
        RequestStatus.PENDING: "offer-pending",
        RequestStatus.ACCEPTED: "offer-accepted",
        RequestStatus.COLLECTED: "offer-collected",
        RequestStatus.COMPLETED: "offer-completed"
    }
    return classes.get(status, "")

def get_status_text_class(status):
    classes = {
        RequestStatus.PENDING: "status-pending",
        RequestStatus.ACCEPTED: "status-accepted",
        RequestStatus.COLLECTED: "status-collected",
        RequestStatus.COMPLETED: "status-completed"
    }
    return classes.get(status, "")

# TELA DE LOGIN
if not st.session_state.logged_in:
    st.markdown("""
    <div style='text-align: center; padding: 3rem 1.5rem;'>
        <div style='width: 4rem; height: 4rem; background: #059669; color: white; border-radius: 1.5rem; 
                    display: flex; align-items: center; justify-content: center; font-size: 2rem; 
                    box-shadow: 0 10px 25px rgba(5, 150, 105, 0.3); margin: 0 auto 1.25rem; 
                    transform: rotate(3deg); animation: bounce 2s infinite;'>
            ♻️
        </div>
        <h1 style='font-size: 3rem; font-weight: 900; color: #0f172a; letter-spacing: -0.05em; margin-bottom: 0.25rem;'>
            EcoCash
        </h1>
        <p style='font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; 
                   letter-spacing: 0.3em; margin-bottom: 2.5rem;'>
            ECONOMIA CIRCULAR 2.5
        </p>
    </div>
    
    <style>
        @keyframes bounce {
            0%, 100% { transform: rotate(3deg) translateY(0); }
            50% { transform: rotate(3deg) translateY(-10px); }
        }
    </style>
    """, unsafe_allow_html=True)
    
    for user in INITIAL_USERS:
        role_icons = {
            UserRole.RESIDENT: "🏠",
            UserRole.COLLECTOR: "🏍️",
            UserRole.POINT: "🏪"
        }
        
        role_colors = {
            UserRole.RESIDENT: "#059669",
            UserRole.COLLECTOR: "#2563eb",
            UserRole.POINT: "#7c3aed"
        }
        
        st.markdown(f"""
        <div style='background: #f8fafc; padding: 1rem; border-radius: 1.8rem; margin: 0.75rem 0; 
                    display: flex; align-items: center; gap: 1rem; cursor: pointer; 
                    border: 2px solid transparent; transition: all 0.3s;'
             onmouseover="this.style.background='#f0fdf4'; this.style.borderColor='#d1fae5';"
             onmouseout="this.style.background='#f8fafc'; this.style.borderColor='transparent';">
            <div style='width: 3rem; height: 3rem; background: {role_colors[user["role"]]}; color: white; 
                        border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; 
                        font-size: 0.875rem; box-shadow: 0 4px 12px {role_colors[user["role"]]}33;'>
                {role_icons[user["role"]]}
            </div>
            <div style='flex: 1;'>
                <p style='font-weight: 900; color: #0f172a; font-size: 1rem; margin: 0; line-height: 1.2;'>
                    {user["name"]}
                </p>
                <p style='font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; 
                          letter-spacing: 0.2em; margin: 0.125rem 0 0;'>
                    {user["role"].value}
                </p>
            </div>
            <span style='color: #cbd5e1; font-size: 0.75rem;'>›</span>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button(f"Login {user['id']}", key=user["id"], use_container_width=True):
            login_user(user["id"])
    
    st.markdown("""
    <div style='text-align: center; padding: 1.25rem 0; margin-top: 2.5rem;'>
        <p style='font-size: 8px; font-weight: 700; color: #cbd5e1; text-transform: uppercase; 
                  letter-spacing: 0.2em; display: flex; align-items: center; justify-content: center; gap: 0.5rem;'>
            <span style='color: rgba(5, 150, 105, 0.3);'>🛡️</span>
            SECURE SMART CONTRACTS
        </p>
    </div>
    """, unsafe_allow_html=True)

# TELA PRINCIPAL
else:
    user = st.session_state.current_user
    
    # HEADER
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col1:
        st.markdown("<div style='height: 20px;'></div>", unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class='eco-header'>
            <div style='display: flex; justify-content: space-between; align-items: center;'>
                <div>
                    <div class='eco-header-title'>ECOCASH MOBILE</div>
                    <div class='eco-header-name'>{user['name'].split()[0]}</div>
                </div>
                <div style='display: flex; align-items: center; gap: 0.5rem;'>
                    <div class='eco-balance'>
                        <span class='eco-balance-value'>R$ {user['balance']:.2f}</span>
                    </div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        if st.button("⚡", key="logout_btn"):
            logout_user()
    
    # NAVEGAÇÃO
    nav_col1, nav_col2, nav_col3 = st.columns(3)
    
    with nav_col1:
        if st.button("🏠 Dashboard", key="nav_home", use_container_width=True):
            st.session_state.view = 'home'
            st.rerun()
    
    with nav_col2:
        if st.button("🧾 Extrato", key="nav_history", use_container_width=True):
            st.session_state.view = 'history'
            st.rerun()
    
    with nav_col3:
        if st.button("👤 Perfil", key="nav_profile", use_container_width=True):
            st.session_state.view = 'profile'
            st.rerun()
    
    st.markdown("<div style='margin: 1.25rem;'></div>", unsafe_allow_html=True)
    
    # CONTEÚDO PRINCIPAL
    if st.session_state.view == 'home':
        
        # MORADOR
        if user["role"] == UserRole.RESIDENT:
            st.markdown("""
            <div class='card-white' style='text-align: center;'>
                <div class='card-icon'>➕</div>
                <h3 style='font-weight: 900; color: #0f172a; font-size: 0.875rem; margin: 0.75rem 0 0.25rem;'>
                    Vender material
                </h3>
                <p style='font-size: 10px; color: #94a3b8; font-weight: 600; margin: 0 0 1rem;'>
                    IA avalia o preço médio.
                </p>
            </div>
            """, unsafe_allow_html=True)
            
            if st.button("➕ NOVO ANÚNCIO", key="new_offer_btn", use_container_width=True):
                st.session_state.show_modal = True
                st.rerun()
            
            st.markdown("<div class='section-header'>MEUS ANÚNCIOS</div>", unsafe_allow_html=True)
            
            my_offers = [o for o in st.session_state.offers if o["residentId"] == user["id"]]
            
            if not my_offers:
                st.markdown("""
                <div class='empty-state'>
                    <div class='empty-icon'>👻</div>
                    <div class='empty-text'>TUDO VAZIO POR AQUI</div>
                </div>
                """, unsafe_allow_html=True)
            else:
                for offer in my_offers:
                    st.markdown(f"""
                    <div class='offer-card'>
                        <div class='offer-icon {get_status_class(offer['status'])}'>
                            {get_status_icon(offer['status'])}
                        </div>
                        <div style='flex: 1; overflow: hidden;'>
                            <h5 class='offer-title'>{offer['type']}</h5>
                            <p class='offer-id'>{offer['id']} • {offer['weight']:.1f}kg</p>
                        </div>
                        <div style='text-align: right; flex-shrink: 0;'>
                            <p class='offer-value'>R$ {offer['value']:.2f}</p>
                            <p class='offer-status {get_status_text_class(offer['status'])}'>
                                {offer['status'].value}
                            </p>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
        
        # COLETOR
        elif user["role"] == UserRole.COLLECTOR:
            st.markdown("""
            <div class='stat-card'>
                <div style='display: flex; justify-content: space-between; align-items: center;'>
                    <div>
                        <div class='stat-label'>COLETAS DO DIA</div>
                        <div class='stat-value'>12.8 KG</div>
                    </div>
                    <div style='font-size: 2rem; opacity: 0.3;'>🏍️</div>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            # Sub-tabs
            tab_col1, tab_col2 = st.columns(2)
            
            with tab_col1:
                if st.button("📍 DISPONÍVEIS", key="tab_available", use_container_width=True):
                    st.session_state.sub_tab = 'available'
                    st.rerun()
            
            with tab_col2:
                if st.button("🚚 MINHAS COLETAS", key="tab_ongoing", use_container_width=True):
                    st.session_state.sub_tab = 'ongoing'
                    st.rerun()
            
            st.markdown("<div style='margin: 1rem 0;'></div>", unsafe_allow_html=True)
            
            if st.session_state.sub_tab == 'available':
                available = [o for o in st.session_state.offers if o["status"] == RequestStatus.PENDING]
                
                if not available:
                    st.markdown("""
                    <div class='empty-state'>
                        <div class='empty-icon'>👻</div>
                        <div class='empty-text'>TUDO VAZIO POR AQUI</div>
                    </div>
                    """, unsafe_allow_html=True)
                else:
                    for offer in available:
                        st.markdown(f"""
                        <div class='card-white'>
                            <div style='display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;'>
                                <div>
                                    <p style='font-weight: 900; color: #0f172a; font-size: 0.8125rem; margin: 0;'>
                                        {offer['type']}
                                    </p>
                                    <p style='font-size: 10px; font-weight: 700; color: #94a3b8; margin: 0.25rem 0 0;'>
                                        {offer['weight']:.1f}kg • 1.4km
                                    </p>
                                </div>
                                <span style='color: #059669; font-weight: 900; font-size: 0.875rem;'>
                                    R$ {offer['value']:.2f}
                                </span>
                            </div>
                        </div>
                        """, unsafe_allow_html=True)
                        
                        if st.button(f"✅ ACEITAR COLETA", key=f"accept_{offer['id']}", use_container_width=True):
                            accept_offer(offer['id'])
            
            else:  # ongoing
                my_collections = [o for o in st.session_state.offers 
                                if o.get("collectorId") == user["id"] and o["status"] != RequestStatus.COMPLETED]
                
                if not my_collections:
                    st.markdown("""
                    <div class='empty-state'>
                        <div class='empty-icon'>👻</div>
                        <div class='empty-text'>TUDO VAZIO POR AQUI</div>
                    </div>
                    """, unsafe_allow_html=True)
                else:
                    for offer in my_collections:
                        border_color = "#d1fae5" if offer["status"] == RequestStatus.COLLECTED else "#dbeafe"
                        
                        st.markdown(f"""
                        <div class='card-white' style='border: 2px solid {border_color};'>
                            <div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;'>
                                <span style='font-size: 9px; font-weight: 900; color: #2563eb; text-transform: uppercase; 
                                            background: #dbeafe; padding: 0.25rem 0.5rem; border-radius: 0.375rem;'>
                                    {offer['id']}
                                </span>
                                <span style='font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase;'>
                                    {offer['status'].value}
                                </span>
                            </div>
                            <p style='font-weight: 900; color: #0f172a; font-size: 0.875rem; margin: 0 0 0.75rem;'>
                                {offer['type']}
                            </p>
                        </div>
                        """, unsafe_allow_html=True)
                        
                        if offer["status"] == RequestStatus.ACCEPTED:
                            actual_weight = st.number_input(
                                "Peso Real (kg)",
                                min_value=0.1,
                                value=float(offer['weight']),
                                step=0.1,
                                key=f"weight_{offer['id']}"
                            )
                            
                            if st.button(f"📦 COLETAR", key=f"collect_{offer['id']}", use_container_width=True):
                                if actual_weight > 0:
                                    collect_offer(offer['id'], actual_weight)
                        
                        elif offer["status"] == RequestStatus.COLLECTED:
                            st.success(f"✅ Aguardando Validação")
                            if st.button(f"🧾 VER RECIBO DIGITAL", key=f"receipt_{offer['id']}", use_container_width=True):
                                st.session_state.active_receipt = offer
                                st.rerun()
        
        # PONTO
        elif user["role"] == UserRole.POINT:
            st.markdown("""
            <div class='point-header'>
                <p style='font-size: 9px; font-weight: 900; opacity: 0.6; text-transform: uppercase; 
                          letter-spacing: 0.2em; margin: 0 0 0.25rem;'>
                    PONTO DE LIQUIDAÇÃO
                </p>
                <h3 style='font-size: 1.25rem; font-weight: 900; margin: 0;'>Terminal Ativo</h3>
            </div>
            """, unsafe_allow_html=True)
            
            st.markdown("""
            <div class='card-white'>
                <h4 class='section-header' style='margin: 0 0 1rem;'>COLETAS PARA LIQUIDAR</h4>
            """, unsafe_allow_html=True)
            
            collected = [o for o in st.session_state.offers if o["status"] == RequestStatus.COLLECTED]
            
            if not collected:
                st.markdown("""
                <p style='font-size: 10px; font-weight: 900; color: #cbd5e1; text-align: center; padding: 2rem 0;'>
                    Nenhuma coleta aguardando validação
                </p>
                """, unsafe_allow_html=True)
            else:
                for offer in collected:
                    st.markdown(f"""
                    <div style='background: #f8fafc; padding: 1rem; border-radius: 1rem; margin: 0.75rem 0;'>
                        <div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;'>
                            <div>
                                <p style='font-weight: 900; color: #0f172a; font-size: 0.8125rem; margin: 0;'>
                                    {offer['type']}
                                </p>
                                <p style='font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin: 0.25rem 0 0;'>
                                    {offer['id']} • {offer['actualWeight']}kg
                                </p>
                            </div>
                            <p style='font-size: 0.875rem; font-weight: 900; color: #0f172a; margin: 0;'>
                                R$ {offer['value']:.2f}
                            </p>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    if st.button(f"✅ VALIDAR PAGAMENTO", key=f"liquidate_{offer['id']}", use_container_width=True):
                        liquidate_offer(offer['id'])
            
            st.markdown("</div>", unsafe_allow_html=True)
    
    elif st.session_state.view == 'history':
        st.markdown("<div class='section-header'>MOVIMENTAÇÕES</div>", unsafe_allow_html=True)
        
        completed = [o for o in st.session_state.offers if o["status"] == RequestStatus.COMPLETED]
        
        if not completed:
            st.markdown("""
            <div class='empty-state'>
                <div class='empty-icon'>👻</div>
                <div class='empty-text'>TUDO VAZIO POR AQUI</div>
            </div>
            """, unsafe_allow_html=True)
        else:
            for offer in completed:
                st.markdown(f"""
                <div class='card-white'>
                    <div style='display: flex; align-items: center; gap: 0.75rem;'>
                        <span style='color: #059669; font-size: 0.875rem;'>✅</span>
                        <div style='flex: 1;'>
                            <p style='font-size: 0.6875rem; font-weight: 900; color: #0f172a; margin: 0;'>
                                {offer['type']}
                            </p>
                            <p style='font-size: 9px; font-weight: 700; color: #94a3b8; margin: 0.125rem 0 0;'>
                                {offer['id']}
                            </p>
                        </div>
                        <span style='font-size: 0.6875rem; font-weight: 900; color: #059669;'>
                            +R$ {offer['value']:.2f}
                        </span>
                    </div>
                </div>
                """, unsafe_allow_html=True)
    
    # MODAL: NOVO ANÚNCIO
    if st.session_state.show_modal:
        with st.container():
            st.markdown("""
            <div style='background: rgba(15, 23, 42, 0.6); position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                        z-index: 1000; backdrop-filter: blur(8px);'>
            </div>
            """, unsafe_allow_html=True)
            
            st.markdown("""
            <div style='background: white; border-radius: 2.5rem 2.5rem 0 0; padding: 1.5rem; 
                        position: fixed; bottom: 0; left: 0; right: 0; z-index: 1001; 
                        box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.2); max-width: 390px; margin: 0 auto;'>
                <div style='width: 2.5rem; height: 0.25rem; background: #e2e8f0; border-radius: 1rem; 
                            margin: 0 auto 1.5rem;'></div>
                <div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;'>
                    <h2 style='font-size: 1.25rem; font-weight: 900; color: #0f172a; margin: 0;'>
                        Vender Plástico
                    </h2>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            st.markdown("<div style='margin-bottom: 90px;'></div>", unsafe_allow_html=True)
            
            material_desc = st.text_area(
                "O QUE VOCÊ TEM?",
                placeholder="Ex: 5 Garrafas PET e 2 Caixas...",
                height=100,
                key="material_input"
            )
            
            if st.button("☁️ PUBLICAR AGORA", key="publish_btn", use_container_width=True):
                if material_desc:
                    # Simula avaliação com IA
                    weight = round(1.5 + random.random() * 4, 1)
                    value = round(3.0 + random.random() * 12, 2)
                    create_offer(material_desc, weight, value)
                else:
                    st.warning("⚠️ Descreva o material")
            
            if st.button("✕ Fechar", key="close_modal_btn"):
                st.session_state.show_modal = False
                st.rerun()
    
    # MODAL: RECIBO
    if st.session_state.active_receipt:
        receipt = st.session_state.active_receipt
        
        st.markdown(f"""
        <div style='background: rgba(15, 23, 42, 0.8); position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                    z-index: 2000; backdrop-filter: blur(12px); display: flex; align-items: center; 
                    justify-content: center; padding: 1.5rem;'>
            <div class='receipt-modal'>
                <div class='receipt-header'>
                    <div class='receipt-icon'>🧾</div>
                    <h3 class='receipt-title'>Recibo de Coleta</h3>
                    <p style='font-size: 10px; font-weight: 700; opacity: 0.7; margin: 0.5rem 0 0;'>
                        EcoCash Cloud • {receipt['id']}
                    </p>
                </div>
                
                <div class='receipt-body'>
                    <div style='border-bottom: 1px dashed #e2e8f0; padding-bottom: 1.25rem; margin-bottom: 1.25rem;'>
                        <div class='receipt-line'>
                            <span class='receipt-label'>MATERIAL:</span>
                            <span class='receipt-value'>{receipt['type']}</span>
                        </div>
                        <div class='receipt-line'>
                            <span class='receipt-label'>PESO CONFIRMADO:</span>
                            <span class='receipt-value'>{receipt['actualWeight']} KG</span>
                        </div>
                        <div class='receipt-line' style='border-top: 1px solid #f8fafc; padding-top: 0.75rem; margin-top: 0.75rem;'>
                            <span class='receipt-label'>VALOR ESTIMADO:</span>
                            <span class='receipt-value' style='color: #059669;'>R$ {receipt['value']:.2f}</span>
                        </div>
                        <div class='receipt-line'>
                            <span class='receipt-label'>REPASSE COLETOR:</span>
                            <span class='receipt-value' style='color: #2563eb;'>R$ {(receipt['value'] * 0.3):.2f}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        col1, col2, col3 = st.columns([1, 2, 1])
        
        with col2:
            if st.button("📤 COMPARTILHAR", key="share_receipt", use_container_width=True):
                st.info(f"Recibo {receipt['id']} copiado!")
            
            if st.button("📥 BAIXAR PDF", key="download_receipt", use_container_width=True):
                st.info("Função de download em desenvolvimento")
            
            if st.button("FECHAR", key="close_receipt", use_container_width=True):
                st.session_state.active_receipt = None
                st.rerun()
