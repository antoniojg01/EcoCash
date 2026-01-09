import streamlit as st
import random
import time
import os
from enum import Enum
from datetime import datetime

# ====================================================================
# CONFIGURAÇÃO DA PÁGINA (igual ao index.html original)
# ====================================================================
st.set_page_config(
    page_title="EcoCash - Reciclagem Inteligente",
    page_icon="♻️",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# ====================================================================
# ENUMS & INTERFACES (exatamente como no App.tsx)
# ====================================================================
class UserRole(Enum):
    RESIDENT = 'MORADOR'
    COLLECTOR = 'COLETOR'
    POINT = 'PONTO'

class RequestStatus(Enum):
    PENDING = 'PENDENTE'
    ACCEPTED = 'ACEITO'
    COLLECTED = 'COLETADO'
    COMPLETED = 'CONCLUÍDO'

# ====================================================================
# CONSTANTS (igual ao App.tsx)
# ====================================================================
STORAGE_KEY = 'ecocash_db_v5'
INITIAL_USERS = [
    {"id": "u1", "name": "João Silva", "role": UserRole.RESIDENT, "balance": 42.50},
    {"id": "u2", "name": "Carlos Santos", "role": UserRole.COLLECTOR, "balance": 115.80},
    {"id": "u3", "name": "Ponto Eco-Recicle", "role": UserRole.POINT, "balance": 2500.00}
]

# ====================================================================
# INICIALIZAÇÃO DO SESSION STATE (Persistence como no App.tsx)
# ====================================================================
if 'user' not in st.session_state:
    st.session_state.user = None
if 'offers' not in st.session_state:
    # Carrega do localStorage simulado
    st.session_state.offers = []
if 'view' not in st.session_state:
    st.session_state.view = 'home'
if 'subTab' not in st.session_state:
    st.session_state.subTab = 'available'
if 'isModalOpen' not in st.session_state:
    st.session_state.isModalOpen = False
if 'loading' not in st.session_state:
    st.session_state.loading = False
if 'confirmedWeight' not in st.session_state:
    st.session_state.confirmedWeight = ''
if 'activeReceipt' not in st.session_state:
    st.session_state.activeReceipt = None
if 'users' not in st.session_state:
    st.session_state.users = {u["id"]: u.copy() for u in INITIAL_USERS}
if 'material_description' not in st.session_state:
    st.session_state.material_description = ''

# ====================================================================
# FUNÇÕES (TODAS do App.tsx original)
# ====================================================================

def handleLogin(u):
    """Função handleLogin original"""
    st.session_state.user = st.session_state.users[u].copy()
    st.session_state.subTab = 'available'
    st.session_state.view = 'home'
    st.rerun()

def handleLogout():
    """Função handleLogout original"""
    st.session_state.user = None
    st.rerun()

def createOffer(description):
    """Função createOffer original com simulação de IA"""
    if not st.session_state.user or not description:
        return
    
    st.session_state.loading = True
    
    # Simula delay da API (como no original)
    time.sleep(1)
    
    # Gera oferta (lógica original)
    newOffer = {
        "id": f"ECO-{random.randint(1000, 9999)}",
        "residentId": st.session_state.user["id"],
        "type": description,
        "weight": round(1.5 + random.random() * 4, 1),
        "value": round(3.0 + random.random() * 12, 2),
        "status": RequestStatus.PENDING,
        "collectorId": None,
        "actualWeight": None
    }
    
    st.session_state.offers.insert(0, newOffer)
    st.session_state.loading = False
    st.session_state.isModalOpen = False
    st.session_state.material_description = ''
    st.rerun()

def updateStatus(offer_id, status, extra=None):
    """Função updateStatus original"""
    if extra is None:
        extra = {}
    
    for i, o in enumerate(st.session_state.offers):
        if o["id"] == offer_id:
            st.session_state.offers[i]["status"] = status
            for key, value in extra.items():
                st.session_state.offers[i][key] = value
            break

def handleCollect(offer):
    """Função handleCollect original"""
    try:
        weight = float(st.session_state.confirmedWeight)
    except:
        st.error("Insira o peso medido.")
        return
    
    if weight <= 0:
        st.error("Insira o peso medido.")
        return
    
    newValue = (offer["value"] / offer["weight"]) * weight
    updatedOffer = offer.copy()
    updatedOffer["status"] = RequestStatus.COLLECTED
    updatedOffer["actualWeight"] = weight
    updatedOffer["value"] = newValue
    
    updateStatus(offer["id"], RequestStatus.COLLECTED, {
        "actualWeight": weight,
        "value": newValue
    })
    
    st.session_state.confirmedWeight = ''
    # Abre o recibo automaticamente após coletar (como no original)
    st.session_state.activeReceipt = updatedOffer
    st.rerun()

def handleLiquidate(offer_id):
    """Função handleLiquidate original"""
    offer = None
    for o in st.session_state.offers:
        if o["id"] == offer_id:
            offer = o
            break
    
    if not offer or not st.session_state.user:
        return
    
    if st.session_state.user["balance"] < offer["value"]:
        st.error("Saldo insuficiente no Ponto!")
        time.sleep(1)
        st.rerun()
        return
    
    resVal = offer["value"] * 0.7
    colVal = offer["value"] * 0.3
    
    updateStatus(offer_id, RequestStatus.COMPLETED, {})
    
    # Atualiza saldos
    st.session_state.user["balance"] -= offer["value"]
    st.session_state.users[st.session_state.user["id"]]["balance"] -= offer["value"]
    st.session_state.users[offer["residentId"]]["balance"] += resVal
    st.session_state.users[offer["collectorId"]]["balance"] += colVal
    
    st.success(f"Liquidação efetuada!\n\nMorador: +R$ {resVal:.2f}\nColetor: +R$ {colVal:.2f}")
    time.sleep(2)
    st.rerun()

def handleShareReceipt(offer):
    """Função handleShareReceipt original"""
    text = f"Recibo EcoCash: Coleta {offer['id']}\nMaterial: {offer['type']}\nPeso: {offer['actualWeight']}kg\nValor: R$ {offer['value']:.2f}"
    st.info(f"Recibo copiado!\n\n{text}")

# ====================================================================
# CSS COMPLETO (replicando exatamente o estilo original)
# ====================================================================
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
    
    /* Ocultar elementos Streamlit */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .stDeployButton {display: none;}
    
    /* Reset */
    * {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
    }
    
    .main {
        padding: 0 !important;
        background-color: #cbd5e1;
    }
    
    .block-container {
        padding: 0 !important;
        max-width: 390px !important;
    }
    
    /* Container principal */
    .app-container {
        max-width: 390px;
        margin: 0 auto;
        background: #f8fafc;
        min-height: 100vh;
        box-shadow: 0 0 50px rgba(0,0,0,0.1);
        border-left: 1px solid #e2e8f0;
        border-right: 1px solid #e2e8f0;
    }
    
    /* Header */
    .eco-header {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        padding: 2.5rem 1.25rem 1.5rem;
        border-radius: 0 0 2rem 2rem;
        box-shadow: 0 10px 25px rgba(5, 150, 105, 0.2);
        margin-bottom: 1.25rem;
        position: relative;
    }
    
    .eco-header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .eco-header-title {
        font-size: 9px;
        font-weight: 900;
        color: #a7f3d0;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        line-height: 1;
        margin-bottom: 0.25rem;
    }
    
    .eco-header-name {
        font-size: 1.125rem;
        font-weight: 900;
        color: white;
        line-height: 1.2;
        letter-spacing: -0.025em;
    }
    
    .eco-balance {
        background: rgba(255, 255, 255, 0.15);
        padding: 0.375rem 0.625rem;
        border-radius: 0.5rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
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
        margin: 0.75rem 1.25rem;
        text-align: center;
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
    
    .card-title {
        font-weight: 900;
        color: #0f172a;
        font-size: 0.875rem;
        margin: 0.75rem 0 0.25rem;
    }
    
    .card-subtitle {
        font-size: 10px;
        color: #94a3b8;
        font-weight: 600;
        margin: 0;
    }
    
    /* Offer Card */
    .offer-card {
        background: white;
        padding: 1rem;
        border-radius: 1rem;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        margin: 0.75rem 1.25rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        transition: transform 0.2s;
    }
    
    .offer-card:active {
        transform: scale(0.98);
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
    
    .offer-content {
        flex: 1;
        overflow: hidden;
    }
    
    .offer-title {
        font-weight: 900;
        color: #0f172a;
        font-size: 0.8125rem;
        line-height: 1.2;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .offer-id {
        font-size: 9px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0.125rem 0 0;
    }
    
    .offer-right {
        text-align: right;
        flex-shrink: 0;
    }
    
    .offer-value {
        font-size: 0.75rem;
        font-weight: 900;
        color: #0f172a;
        margin: 0;
    }
    
    .offer-status {
        font-size: 7px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin: 0.125rem 0 0;
    }
    
    .status-pending { color: #d97706; }
    .status-accepted { color: #2563eb; }
    .status-collected { color: #059669; }
    .status-completed { color: #047857; }
    
    /* Section headers */
    .section-header {
        font-size: 9px;
        font-weight: 900;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        padding: 0 1.5rem;
        margin: 1.25rem 0 0.625rem;
    }
    
    /* Empty state */
    .empty-state {
        padding: 3rem 1.25rem;
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
    
    /* Botões Streamlit customizados */
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
        transition: all 0.2s;
    }
    
    .stButton > button:hover {
        background: #1e293b;
        transform: scale(0.95);
    }
    
    .stButton > button:active {
        transform: scale(0.95);
    }
    
    /* Input fields */
    .stTextArea textarea {
        background: #f8fafc;
        border: 2px solid #f1f5f9;
        border-radius: 1rem;
        padding: 1rem;
        font-weight: 700;
        font-size: 0.875rem;
        color: #0f172a;
    }
    
    .stTextArea textarea:focus {
        border-color: #059669;
        box-shadow: 0 0 0 1px #059669;
    }
    
    .stNumberInput input {
        background: #f8fafc;
        border: 2px solid #f1f5f9;
        border-radius: 0.5rem;
        padding: 0.5rem;
        font-weight: 700;
        font-size: 0.75rem;
    }
    
    /* Stat card */
    .stat-card {
        background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
        padding: 1.25rem;
        border-radius: 1.8rem;
        box-shadow: 0 10px 25px rgba(37, 99, 235, 0.2);
        color: white;
        margin: 0 1.25rem 1rem;
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
    
    /* Point header */
    .point-header {
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        padding: 1.25rem;
        border-radius: 1.8rem;
        box-shadow: 0 10px 25px rgba(124, 58, 237, 0.2);
        color: white;
        margin: 0 1.25rem 1.25rem;
    }
    
    /* Navigation */
    .nav-container {
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(20px);
        border-top: 1px solid #f1f5f9;
        padding: 0.5rem 1rem 0.5rem;
        position: sticky;
        bottom: 0;
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
        z-index: 50;
    }
    
    /* Collector card styles */
    .collector-card {
        background: white;
        padding: 1rem;
        border-radius: 1rem;
        border: 1px solid #e2e8f0;
        margin: 0.75rem 1.25rem;
    }
    
    .collector-card-accent {
        border: 2px solid #d1fae5;
    }
    
    /* Tabs */
    .tab-container {
        background: rgba(226, 232, 240, 0.5);
        padding: 0.25rem;
        border-radius: 0.75rem;
        margin: 1rem 1.25rem;
        display: flex;
        gap: 0.25rem;
    }
</style>
""", unsafe_allow_html=True)

# ====================================================================
# RENDERIZAÇÃO DA INTERFACE
# ====================================================================

if st.session_state.user is None:
    # ========== TELA DE LOGIN (LoginScreen component) ==========
    st.markdown("""
    <div class="app-container" style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
        <div style="padding: 1.5rem; width: 100%; max-width: 390px;">
            <div style="text-align: center; margin-bottom: 2.5rem;">
                <div style="width: 4rem; height: 4rem; background: #059669; color: white; border-radius: 1.5rem; 
                            display: flex; align-items: center; justify-content: center; font-size: 2rem; 
                            box-shadow: 0 10px 25px rgba(5, 150, 105, 0.3); margin: 0 auto 1.25rem; 
                            transform: rotate(3deg);">
                    <i class="fas fa-recycle"></i>
                </div>
                <h1 style="font-size: 3rem; font-weight: 900; color: #0f172a; letter-spacing: -0.05em; margin: 0.5rem 0 0.25rem;">
                    EcoCash
                </h1>
                <p style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; 
                           letter-spacing: 0.3em; margin: 0;">
                    ECONOMIA CIRCULAR 2.5
                </p>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("<div style='padding: 0 1.5rem;'>", unsafe_allow_html=True)
    
    for user in INITIAL_USERS:
        role_icons = {
            UserRole.RESIDENT: "fa-home",
            UserRole.COLLECTOR: "fa-motorcycle",
            UserRole.POINT: "fa-store"
        }
        
        role_colors = {
            UserRole.RESIDENT: "#059669",
            UserRole.COLLECTOR: "#2563eb",
            UserRole.POINT: "#7c3aed"
        }
        
        st.markdown(f"""
        <div style="background: #f8fafc; padding: 1rem; border-radius: 1.8rem; margin: 0.75rem 0; 
                    display: flex; align-items: center; gap: 1rem; 
                    border: 2px solid transparent; transition: all 0.3s;">
            <div style="width: 3rem; height: 3rem; background: {role_colors[user['role']]}; color: white; 
                        border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; 
                        font-size: 0.875rem; box-shadow: 0 4px 12px {role_colors[user['role']]}33;">
                <i class="fas {role_icons[user['role']]}"></i>
            </div>
            <div style="flex: 1;">
                <p style="font-weight: 900; color: #0f172a; font-size: 1rem; margin: 0; line-height: 1.2;">
                    {user['name']}
                </p>
                <p style="font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; 
                          letter-spacing: 0.2em; margin: 0.125rem 0 0;">
                    {user['role'].value}
                </p>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button(f"Entrar como {user['name']}", key=f"login_{user['id']}", use_container_width=True):
            handleLogin(user['id'])
    
    st.markdown("</div>", unsafe_allow_html=True)
    
    st.markdown("""
    <div style="text-align: center; padding: 1.25rem 0; margin-top: 2.5rem;">
        <p style="font-size: 8px; font-weight: 700; color: #cbd5e1; text-transform: uppercase; 
                  letter-spacing: 0.2em; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <i class="fas fa-shield-check" style="color: rgba(5, 150, 105, 0.3);"></i>
            SECURE SMART CONTRACTS
        </p>
    </div>
    """, unsafe_allow_html=True)

else:
    # ========== APLICAÇÃO PRINCIPAL (App component) ==========
    user = st.session_state.user
    
    # HEADER (exatamente como no App.tsx)
    st.markdown(f"""
    <div class="app-container">
        <div class="eco-header">
            <div class="eco-header-top">
                <div>
                    <div class="eco-header-title">ECOCASH MOBILE</div>
                    <div class="eco-header-name">{user['name'].split()[0]}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div class="eco-balance">
                        <span class="eco-balance-value">R$ {user['balance']:.2f}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Botão de logout
    col_logout1, col_logout2, col_logout3 = st.columns([4, 1, 1])
    with col_logout2:
        if st.button("⚡", key="logout_btn"):
            handleLogout()
    
    # ========== CONTEÚDO POR VIEW ==========
    if st.session_state.view == 'home':
        
        # ===== MORADOR =====
        if user["role"] == UserRole.RESIDENT:
            st.markdown("""
            <div class="card-white">
                <div class="card-icon"><i class="fas fa-plus"></i></div>
                <div class="card-title">Vender material</div>
                <div class="card-subtitle">IA avalia o preço médio.</div>
            </div>
            """, unsafe_allow_html=True)
            
            col1, col2, col3 = st.columns([1, 3, 1])
            with col2:
                if st.button("➕ NOVO ANÚNCIO", key="new_offer", use_container_width=True):
                    st.session_state.isModalOpen = True
                    st.rerun()
            
            st.markdown('<div class="section-header">MEUS ANÚNCIOS</div>', unsafe_allow_html=True)
            
            my_offers = [o for o in st.session_state.offers if o["residentId"] == user["id"]]
            
            if not my_offers:
                st.markdown("""
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-ghost"></i></div>
                    <div class="empty-text">TUDO VAZIO POR AQUI</div>
                </div>
                """, unsafe_allow_html=True)
            else:
                for offer in my_offers:
                    status_class = {
                        RequestStatus.PENDING: "offer-pending",
                        RequestStatus.ACCEPTED: "offer-accepted",
                        RequestStatus.COLLECTED: "offer-collected",
                        RequestStatus.COMPLETED: "offer-completed"
                    }[offer["status"]]
                    
                    status_text_class = {
                        RequestStatus.PENDING: "status-pending",
                        RequestStatus.ACCEPTED: "status-accepted",
                        RequestStatus.COLLECTED: "status-collected",
                        RequestStatus.COMPLETED: "status-completed"
                    }[offer["status"]]
                    
                    status_icon = {
                        RequestStatus.PENDING: "fa-hourglass-start",
                        RequestStatus.ACCEPTED: "fa-truck-loading",
                        RequestStatus.COLLECTED: "fa-check-double",
                        RequestStatus.COMPLETED: "fa-check-double"
                    }[offer["status"]]
                    
                    st.markdown(f"""
                    <div class="offer-card">
                        <div class="offer-icon {status_class}">
                            <i class="fas {status_icon}"></i>
                        </div>
                        <div class="offer-content">
                            <h5 class="offer-title">{offer['type']}</h5>
                            <p class="offer-id">{offer['id']} • {offer['weight']:.1f}kg</p>
                        </div>
                        <div class="offer-right">
                            <p class="offer-value">R$ {offer['value']:.2f}</p>
                            <p class="offer-status {status_text_class}">{offer['status'].value}</p>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
        
        # ===== COLETOR =====
        elif user["role"] == UserRole.COLLECTOR:
            st.markdown("""
            <div class="stat-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div class="stat-label">COLETAS DO DIA</div>
                        <div class="stat-value">12.8 KG</div>
                    </div>
                    <i class="fas fa-motorcycle" style="font-size: 2rem; opacity: 0.3;"></i>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            # Sub-tabs
            col_tab1, col_tab2 = st.columns(2)
            with col_tab1:
                if st.button("📍 DISPONÍVEIS", 
                           key="tab_available",
                           use_container_width=True,
                           type="primary" if st.session_state.subTab == 'available' else "secondary"):
                    st.session_state.subTab = 'available'
                    st.rerun()
            
            with col_tab2:
                if st.button("🚚 MINHAS COLETAS", 
                           key="tab_ongoing",
                           use_container_width=True,
                           type="primary" if st.session_state.subTab == 'ongoing' else "secondary"):
                    st.session_state.subTab = 'ongoing'
                    st.rerun()
            
            if st.session_state.subTab == 'available':
                available_offers = [o for o in st.session_state.offers if o["status"] == RequestStatus.PENDING]
                
                if not available_offers:
                    st.markdown("""
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fas fa-ghost"></i></div>
                        <div class="empty-text">TUDO VAZIO POR AQUI</div>
                    </div>
                    """, unsafe_allow_html=True)
                else:
                    for offer in available_offers:
                        st.markdown(f"""
                        <div class="collector-card">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                                <div>
                                    <p style="font-weight: 900; color: #0f172a; font-size: 0.8125rem; margin: 0;">
                                        {offer['type']}
                                    </p>
                                    <p style="font-size: 10px; font-weight: 700; color: #94a3b8; margin: 0.25rem 0 0;">
                                        {offer['weight']:.1f}kg • 1.4km
                                    </p>
                                </div>
                                <span style="color: #059669; font-weight: 900; font-size: 0.875rem;">
                                    R$ {offer['value']:.2f}
                                </span>
                            </div>
                        </div>
                        """, unsafe_allow_html=True)
                        
                        col1, col2, col3 = st.columns([1, 3, 1])
                        with col2:
                            if st.button("✅ ACEITAR COLETA", key=f"accept_{offer['id']}", use_container_width=True):
                                updateStatus(offer['id'], RequestStatus.ACCEPTED, {"collectorId": user["id"]})
                                st.rerun()
            
            else:  # ongoing
                my_collections = [o for o in st.session_state.offers 
                                 if o.get("collectorId") == user["id"] and o["status"] != RequestStatus.COMPLETED]
                
                if not my_collections:
                    st.markdown("""
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fas fa-ghost"></i></div>
                        <div class="empty-text">TUDO VAZIO POR AQUI</div>
                    </div>
                    """, unsafe_allow_html=True)
                else:
                    for offer in my_collections:
                        border_class = "collector-card-accent" if offer["status"] == RequestStatus.COLLECTED else ""
                        
                        st.markdown(f"""
                        <div class="collector-card {border_class}">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                                <span style="font-size: 9px; font-weight: 900; color: #2563eb; text-transform: uppercase; 
                                            background: #dbeafe; padding: 0.25rem 0.5rem; border-radius: 0.375rem;">
                                    {offer['id']}
                                </span>
                                <span style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">
                                    {offer['status'].value}
                                </span>
                            </div>
                            <p style="font-weight: 900; color: #0f172a; font-size: 0.875rem; margin: 0;">
                                {offer['type']}
                            </p>
                        </div>
                        """, unsafe_allow_html=True)
                        
                        if offer["status"] == RequestStatus.ACCEPTED:
                            col1, col2, col3 = st.columns([1, 2, 1])
                            with col2:
                                weight_input = st.text_input(
                                    "Peso Real (kg)",
                                    value=st.session_state.confirmedWeight,
                                    key=f"weight_{offer['id']}",
                                    placeholder="Peso Real"
                                )
                                st.session_state.confirmedWeight = weight_input
                                
                                if st.button("📦 COLETAR", key=f"collect_{offer['id']}", use_container_width=True):
                                    handleCollect(offer)
                        
                        elif offer["status"] == RequestStatus.COLLECTED:
                            st.success("✅ Aguardando Validação")
                            st.info(f"💰 Você receberá: R$ {(offer['value'] * 0.3):.2f}")
                            
                            col1, col2, col3 = st.columns([1, 2, 1])
                            with col2:
                                if st.button("🧾 VER RECIBO DIGITAL", key=f"receipt_{offer['id']}", use_container_width=True):
                                    st.session_state.activeReceipt = offer.copy()
                                    st.rerun()
        
        # ===== PONTO =====
        elif user["role"] == UserRole.POINT:
            st.markdown("""
            <div class="point-header">
                <p style="font-size: 9px; font-weight: 900; opacity: 0.6; text-transform: uppercase; 
                          letter-spacing: 0.2em; margin: 0 0 0.25rem;">
                    PONTO DE LIQUIDAÇÃO
                </p>
                <h3 style="font-size: 1.25rem; font-weight: 900; margin: 0;">Terminal Ativo</h3>
            </div>
            """, unsafe_allow_html=True)
            
            st.markdown('<div class="section-header">COLETAS PARA LIQUIDAR</div>', unsafe_allow_html=True)
            
            collected_offers = [o for o in st.session_state.offers if o["status"] == RequestStatus.COLLECTED]
            
            if not collected_offers:
                st.markdown("""
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-ghost"></i></div>
                    <div class="empty-text">NENHUMA COLETA AGUARDANDO VALIDAÇÃO</div>
                </div>
                """, unsafe_allow_html=True)
            else:
                for offer in collected_offers:
                    st.markdown(f"""
                    <div class="collector-card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                            <div>
                                <p style="font-weight: 900; color: #0f172a; font-size: 0.8125rem; margin: 0;">
                                    {offer['type']}
                                </p>
                                <p style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin: 0.25rem 0 0;">
                                    {offer['id']} • {offer['actualWeight']}kg
                                </p>
                            </div>
                            <p style="font-size: 0.875rem; font-weight: 900; color: #0f172a; margin: 0;">
                                R$ {offer['value']:.2f}
                            </p>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    col1, col2, col3 = st.columns(3)
                    col1.metric("Total", f"R$ {offer['value']:.2f}")
                    col2.metric("Morador", f"R$ {(offer['value']*0.7):.2f}")
                    col3.metric("Coletor", f"R$ {(offer['value']*0.3):.2f}")
                    
                    col_btn1, col_btn2, col_btn3 = st.columns([1, 2, 1])
                    with col_btn2:
                        if st.button("✅ VALIDAR PAGAMENTO", key=f"liquidate_{offer['id']}", use_container_width=True):
                            handleLiquidate(offer['id'])
    
    elif st.session_state.view == 'history':
        st.markdown('<div class="section-header">MOVIMENTAÇÕES</div>', unsafe_allow_html=True)
        
        completed_offers = [o for o in st.session_state.offers if o["status"] == RequestStatus.COMPLETED]
        
        if not completed_offers:
            st.markdown("""
            <div class="empty-state">
                <div class="empty-icon"><i class="fas fa-ghost"></i></div>
                <div class="empty-text">TUDO VAZIO POR AQUI</div>
            </div>
            """, unsafe_allow_html=True)
        else:
            for offer in completed_offers:
                st.markdown(f"""
                <div class="collector-card">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <i class="fas fa-check-circle" style="color: #059669; font-size: 0.875rem;"></i>
                        <div style="flex: 1;">
                            <p style="font-size: 0.6875rem; font-weight: 900; color: #0f172a; margin: 0;">
                                {offer['type']}
                            </p>
                            <p style="font-size: 9px; font-weight: 700; color: #94a3b8; margin: 0.125rem 0 0;">
                                {offer['id']}
                            </p>
                        </div>
                        <span style="font-size: 0.6875rem; font-weight: 900; color: #059669;">
                            +R$ {offer['value']:.2f}
                        </span>
                    </div>
                </div>
                """, unsafe_allow_html=True)
    
    # ========== MODAL: NOVO ANÚNCIO ==========
    if st.session_state.isModalOpen:
        st.markdown("---")
        st.markdown("### 📦 Vender Plástico")
        st.caption("IA avalia o preço médio")
        
        material_input = st.text_area(
            "O QUE VOCÊ TEM?",
            value=st.session_state.material_description,
            placeholder="Ex: 5 Garrafas PET e 2 Caixas...",
            height=100,
            key="material_desc_input"
        )
        st.session_state.material_description = material_input
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button("☁️ PUBLICAR AGORA" if not st.session_state.loading else "⌛ CALCULANDO...", 
                       key="publish_offer",
                       disabled=st.session_state.loading,
                       use_container_width=True):
                createOffer(st.session_state.material_description)
        
        with col2:
            if st.button("✖ CANCELAR", key="cancel_offer", use_container_width=True):
                st.session_state.isModalOpen = False
                st.session_state.material_description = ''
                st.rerun()
    
    # ========== MODAL: RECIBO ==========
    if st.session_state.activeReceipt:
        receipt = st.session_state.activeReceipt
        
        st.markdown("---")
        st.markdown("""
        <div style="background: #059669; padding: 1.5rem; border-radius: 2rem 2rem 0 0; text-align: center; color: white; margin: 0 -1rem;">
            <div style="width: 3rem; height: 3rem; background: rgba(255,255,255,0.2); border-radius: 0.75rem; 
                        display: flex; align-items: center; justify-content: center; margin: 0 auto 0.5rem; font-size: 1.25rem;">
                <i class="fas fa-receipt"></i>
            </div>
            <h3 style="font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.875rem; margin: 0.5rem 0 0.25rem;">
                Recibo de Coleta
            </h3>
            <p style="font-size: 10px; font-weight: 700; opacity: 0.7; margin: 0;">
                EcoCash Cloud • """ + receipt['id'] + """
            </p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("---")
        st.markdown(f"**MATERIAL:** {receipt['type']}")
        st.markdown(f"**PESO CONFIRMADO:** {receipt['actualWeight']} KG")
        st.markdown(f"**VALOR ESTIMADO:** R$ {receipt['value']:.2f}")
        st.markdown(f"**REPASSE COLETOR:** R$ {(receipt['value'] * 0.3):.2f}")
        st.markdown("---")
        
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            if st.button("📤 COMPARTILHAR", key="share_receipt", use_container_width=True):
                handleShareReceipt(receipt)
            
            if st.button("📥 BAIXAR PDF", key="download_receipt", use_container_width=True):
                st.info("Função de download em implementação")
            
            if st.button("✖ FECHAR", key="close_receipt", use_container_width=True):
                st.session_state.activeReceipt = None
                st.rerun()
    
    # ========== FOOTER NAVIGATION ==========
    st.markdown("<div style='height: 80px;'></div>", unsafe_allow_html=True)
    
    col_nav1, col_nav2, col_nav3 = st.columns(3)
    
    with col_nav1:
        if st.button("🏠 Dashboard", 
                   key="footer_home",
                   use_container_width=True,
                   type="primary" if st.session_state.view == 'home' else "secondary"):
            st.session_state.view = 'home'
            st.rerun()
    
    with col_nav2:
        if st.button("🧾 Extrato", 
                   key="footer_history",
                   use_container_width=True,
                   type="primary" if st.session_state.view == 'history' else "secondary"):
            st.session_state.view = 'history'
            st.rerun()
    
    with col_nav3:
        if st.button("👤 Perfil", 
                   key="footer_profile",
                   use_container_width=True,
                   type="primary" if st.session_state.view == 'profile' else "secondary"):
            st.session_state.view = 'profile'
            st.rerun()
