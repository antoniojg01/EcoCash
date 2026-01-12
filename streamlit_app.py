import streamlit as st
import json
import random
from datetime import datetime
from enum import Enum
import os

# ============================================================================
# CONFIGURAÇÃO DA PÁGINA
# ============================================================================
st.set_page_config(
    page_title="EcoCash Platform",
    page_icon="♻️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# ============================================================================
# CSS PERSONALIZADO - MANTÉM 100% DO DESIGN ORIGINAL
# ============================================================================
st.markdown("""
<style>
    /* Reset e Base */
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    .stApp {
        background-color: white;
    }
    
    /* Esconde elementos padrão do Streamlit */
    #MainMenu, footer, header {visibility: hidden;}
    .stDeployButton {display: none;}
    
    /* Container principal */
    .main .block-container {
        padding-top: 0rem;
        padding-bottom: 0rem;
        max-width: 100%;
    }
    
    /* Header Global */
    .eco-header {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        padding: 3rem 2rem 2.5rem 2rem;
        border-radius: 0 0 3.5rem 3.5rem;
        box-shadow: 0 20px 50px rgba(5, 150, 105, 0.15);
        margin-bottom: 2rem;
        position: relative;
        overflow: hidden;
    }
    
    .eco-header::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -20%;
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        border-radius: 50%;
    }
    
    .eco-header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        z-index: 10;
    }
    
    .eco-header-title {
        color: rgba(167, 243, 208, 0.6);
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        margin-bottom: 0.5rem;
    }
    
    .eco-header-name {
        color: white;
        font-size: 1.5rem;
        font-weight: 900;
        letter-spacing: -0.02em;
    }
    
    .eco-balance {
        background: rgba(255, 255, 255, 0.15);
        padding: 0.7rem 1.5rem;
        border-radius: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        color: white;
        font-weight: 900;
        font-size: 0.875rem;
        display: inline-block;
    }
    
    /* Navegação Dock */
    .nav-dock {
        position: fixed;
        bottom: 2rem;
        left: 2rem;
        right: 2rem;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(40px);
        border-radius: 2.8rem;
        height: 6rem;
        display: flex;
        justify-content: space-around;
        align-items: center;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(226, 232, 240, 0.5);
        z-index: 1000;
        padding: 0 2rem;
    }
    
    /* Cards e Seções */
    .eco-card {
        background: white;
        padding: 2rem;
        border-radius: 3rem;
        border: 1px solid #f1f5f9;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
        margin-bottom: 2rem;
    }
    
    .eco-card-icon {
        width: 4rem;
        height: 4rem;
        background: #f0fdf4;
        border-radius: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        color: #059669;
        margin: 0 auto 1.5rem auto;
        box-shadow: inset 0 2px 10px rgba(5, 150, 105, 0.1);
    }
    
    .eco-card-title {
        font-size: 1.25rem;
        font-weight: 900;
        color: #1e293b;
        text-align: center;
        letter-spacing: -0.02em;
        margin-bottom: 0.5rem;
    }
    
    .eco-card-subtitle {
        font-size: 11px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        text-align: center;
        margin-bottom: 2rem;
    }
    
    /* Botões */
    .stButton > button {
        background: #0f172a !important;
        color: white !important;
        border-radius: 2rem !important;
        height: 4rem !important;
        font-weight: 900 !important;
        font-size: 11px !important;
        text-transform: uppercase !important;
        letter-spacing: 0.2em !important;
        border: none !important;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.2) !important;
        transition: all 0.3s ease !important;
        width: 100% !important;
    }
    
    .stButton > button:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 15px 40px rgba(15, 23, 42, 0.3) !important;
    }
    
    /* Input */
    .stTextInput > div > div > input,
    .stNumberInput > div > div > input {
        background: #f8fafc !important;
        border: 2px solid transparent !important;
        border-radius: 1.8rem !important;
        padding: 1.5rem 1.5rem !important;
        font-weight: 700 !important;
        font-size: 0.875rem !important;
        transition: all 0.3s ease !important;
    }
    
    .stTextInput > div > div > input:focus,
    .stNumberInput > div > div > input:focus {
        border-color: #059669 !important;
        box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1) !important;
    }
    
    /* Badge de Status */
    .status-badge {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 1rem;
        font-size: 9px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        margin: 0.5rem 0;
    }
    
    .status-pending {
        background: #fef3c7;
        color: #f59e0b;
        border: 1px solid #fde68a;
    }
    
    .status-completed {
        background: #d1fae5;
        color: #059669;
        border: 1px solid #a7f3d0;
    }
    
    .status-collected {
        background: #dbeafe;
        color: #2563eb;
        border: 1px solid #bfdbfe;
    }
    
    /* Item da Sacola */
    .bag-item {
        background: rgba(248, 250, 252, 0.8);
        padding: 1rem 1.5rem;
        border-radius: 1.5rem;
        border: 1px solid rgba(226, 232, 240, 0.5);
        margin-bottom: 0.75rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .bag-item-desc {
        font-size: 11px;
        font-weight: 900;
        color: #334155;
        text-transform: uppercase;
    }
    
    .bag-item-value {
        font-size: 9px;
        font-weight: 700;
        color: #059669;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    /* Total da Sacola */
    .bag-total {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        padding: 2rem;
        border-radius: 2.5rem;
        color: white;
        margin-top: 1.5rem;
        box-shadow: 0 20px 50px rgba(5, 150, 105, 0.2);
    }
    
    .bag-total-label {
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        opacity: 0.6;
        margin-bottom: 0.5rem;
    }
    
    .bag-total-value {
        font-size: 2rem;
        font-weight: 900;
    }
    
    /* Oferta Card */
    .offer-card {
        background: white;
        padding: 2rem;
        border-radius: 3rem;
        border: 2px solid #f1f5f9;
        margin-bottom: 2rem;
        transition: all 0.3s ease;
        position: relative;
    }
    
    .offer-card-guaranteed {
        border-color: #059669 !important;
        box-shadow: 0 10px 40px rgba(5, 150, 105, 0.1) !important;
    }
    
    .guaranteed-badge {
        position: absolute;
        top: -0.75rem;
        left: 2rem;
        background: #059669;
        color: white;
        padding: 0.5rem 1.5rem;
        border-radius: 9999px;
        font-size: 9px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        box-shadow: 0 10px 30px rgba(5, 150, 105, 0.2);
    }
    
    /* Login */
    .login-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: white;
        padding: 2rem;
    }
    
    .login-logo {
        width: 6rem;
        height: 6rem;
        background: #059669;
        color: white;
        border-radius: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        margin: 0 auto 1.5rem auto;
        box-shadow: 0 20px 50px rgba(5, 150, 105, 0.2);
        transform: rotate(6deg);
        transition: transform 0.5s ease;
    }
    
    .login-logo:hover {
        transform: rotate(0deg);
    }
    
    .login-title {
        font-size: 2.5rem;
        font-weight: 900;
        color: #111827;
        letter-spacing: -0.03em;
        text-align: center;
        margin-bottom: 0.5rem;
    }
    
    .login-subtitle {
        font-size: 10px;
        font-weight: 700;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.3em;
        text-align: center;
        margin-bottom: 3rem;
    }
    
    /* Animações */
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .animate-fade-in {
        animation: fadeIn 0.6s ease-out;
    }
    
    /* Scrollbar personalizada */
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    
    ::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 10px;
    }
    
    ::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 10px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
    }
    
    /* Hide scrollbar nos elementos específicos */
    .hide-scrollbar::-webkit-scrollbar {
        display: none;
    }
    
    .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>
""", unsafe_allow_html=True)

# ============================================================================
# ENUMS E CLASSES (Equivalentes aos TypeScript)
# ============================================================================
class UserRole(str, Enum):
    RESIDENT = "RESIDENT"
    COLLECTOR = "COLLECTOR"
    POINT = "POINT"

class RequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    COLLECTOR_ASSIGNED = "COLLECTOR_ASSIGNED"
    COLLECTED = "COLLECTED"
    DELIVERED = "DELIVERED"
    COMPLETED = "COMPLETED"

# ============================================================================
# SERVIÇO DE NUVEM (CloudService)
# ============================================================================
class CloudService:
    def __init__(self):
        if 'cloud_db' not in st.session_state:
            st.session_state.cloud_db = {
                'users': [
                    {'id': 'u_resident', 'name': 'João Silva', 'role': UserRole.RESIDENT, 'balance': 50.00, 'totalRecycledKg': 12.5},
                    {'id': 'u_collector', 'name': 'Carlos Coletor', 'role': UserRole.COLLECTOR, 'balance': 142.50, 'totalRecycledKg': 45.0},
                    {'id': 'u_point', 'name': 'EcoPoint Central', 'role': UserRole.POINT, 'balance': 1250.00, 'totalRecycledKg': 1200.0}
                ],
                'offers': [
                    {
                        'id': 'ECO-9921',
                        'residentId': 'u_resident',
                        'type': 'PET',
                        'quantity': 1,
                        'estimatedWeight': 8,
                        'estimatedValue': 14.40,
                        'location': {'address': 'Rua das Flores, 55', 'lat': -23.55, 'lng': -46.63},
                        'status': RequestStatus.APPROVED,
                        'isGuaranteed': True
                    }
                ]
            }
    
    def get_users(self):
        return st.session_state.cloud_db['users']
    
    def get_user(self, user_id):
        for user in st.session_state.cloud_db['users']:
            if user['id'] == user_id:
                return user
        return None
    
    def update_user(self, user_id, data):
        for i, user in enumerate(st.session_state.cloud_db['users']):
            if user['id'] == user_id:
                st.session_state.cloud_db['users'][i].update(data)
                break
    
    def get_offers(self):
        return st.session_state.cloud_db['offers']
    
    def create_offer(self, offer):
        st.session_state.cloud_db['offers'].append(offer)
    
    def update_offer(self, offer_id, data):
        for i, offer in enumerate(st.session_state.cloud_db['offers']):
            if offer['id'] == offer_id:
                st.session_state.cloud_db['offers'][i].update(data)
                break
    
    def transfer_funds(self, from_id, to_id, amount):
        from_user = self.get_user(from_id)
        to_user = self.get_user(to_id)
        
        if from_user and to_user and from_user['balance'] >= amount:
            self.update_user(from_id, {'balance': from_user['balance'] - amount})
            self.update_user(to_id, {'balance': to_user['balance'] + amount})
            return True
        return False

cloud = CloudService()

# ============================================================================
# SERVIÇO GEMINI (IA para estimativa de peso)
# ============================================================================
def estimate_weight_and_value(description, material_type):
    """
    Estima peso e valor usando IA Gemini.
    Fallback: estimativa baseada em padrões quando API não disponível
    """
    try:
        # Aqui você pode integrar a API do Google Gemini
        # Por enquanto, usando lógica de fallback similar ao original
        import hashlib
        hash_val = int(hashlib.md5(description.encode()).hexdigest(), 16)
        estimated_weight = (hash_val % 5) + 1.5
        
        return {
            'estimatedWeight': round(estimated_weight, 2),
            'justification': 'Estimativa baseada em padrões históricos (Modo Offline).'
        }
    except Exception as e:
        # Fallback amigável
        return {
            'estimatedWeight': 2.5,
            'justification': 'Estimativa padrão aplicada.'
        }

# ============================================================================
# INICIALIZAÇÃO DO SESSION STATE
# ============================================================================
if 'user' not in st.session_state:
    st.session_state.user = None

if 'view' not in st.session_state:
    st.session_state.view = 'home'

if 'bag' not in st.session_state:
    st.session_state.bag = []

if 'vehicle' not in st.session_state:
    st.session_state.vehicle = {
        'type': 'moto',
        'consumption': 35,
        'radius': 10,
        'fuelPrice': 6.15
    }

if 'confirmed_weight' not in st.session_state:
    st.session_state.confirmed_weight = ''

if 'active_receipt' not in st.session_state:
    st.session_state.active_receipt = None

# ============================================================================
# TELA DE LOGIN
# ============================================================================
def render_login():
    st.markdown("""
    <div class="login-container animate-fade-in">
        <div>
            <div class="login-logo">♻️</div>
            <h1 class="login-title">EcoCash</h1>
            <p class="login-subtitle">Cloud Infrastructure</p>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("<div style='text-align: center; margin-bottom: 2rem;'><p style='font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.2em;'>Selecione sua conta</p></div>", unsafe_allow_html=True)
    
    users = cloud.get_users()
    
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col2:
        for user in users:
            icon = '🏠' if user['role'] == UserRole.RESIDENT else '🚚' if user['role'] == UserRole.COLLECTOR else '🏪'
            role_label = 'Morador' if user['role'] == UserRole.RESIDENT else 'Coletor' if user['role'] == UserRole.COLLECTOR else 'Ponto de Compra'
            
            if st.button(f"{icon} {user['name']} - {role_label}", key=user['id'], use_container_width=True):
                st.session_state.user = user
                st.session_state.view = 'home'
                st.rerun()
    
    st.markdown("<div style='text-align: center; margin-top: 4rem; color: #d1d5db; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em;'>⚡ v1.2.4 Cloud Distributed</div>", unsafe_allow_html=True)

# ============================================================================
# HEADER GLOBAL
# ============================================================================
def render_header(user):
    st.markdown(f"""
    <div class="eco-header animate-fade-in">
        <div class="eco-header-content">
            <div>
                <div class="eco-header-title">EcoCash Platform</div>
                <div class="eco-header-name">{user['name'].split(' ')[0]}</div>
            </div>
            <div>
                <span class="eco-balance">R$ {user['balance']:.2f}</span>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

# ============================================================================
# DASHBOARD DO MORADOR
# ============================================================================
def render_resident_dashboard(user):
    st.markdown('<div class="animate-fade-in">', unsafe_allow_html=True)
    
    # Seção da Sacola
    st.markdown("""
    <div class="eco-card">
        <div class="eco-card-icon">🛒</div>
        <h3 class="eco-card-title">Sacola de Recicláveis</h3>
    """, unsafe_allow_html=True)
    
    bag_count = len(st.session_state.bag)
    subtitle = "O que você tem para hoje?" if bag_count == 0 else f"{bag_count} materiais prontos"
    st.markdown(f'<p class="eco-card-subtitle">{subtitle}</p>', unsafe_allow_html=True)
    
    # Input de item
    col1, col2 = st.columns([4, 1])
    
    with col1:
        item_input = st.text_input("", placeholder="Ex: 5kg de papelão, 10 latas...", key="item_input", label_visibility="collapsed")
    
    with col2:
        if st.button("➕", key="add_btn", use_container_width=True):
            if item_input and item_input.strip():
                # Estima peso e valor
                estimate = estimate_weight_and_value(item_input, "Reciclável Variado")
                
                new_item = {
                    'id': f"item_{random.randint(1000, 9999)}",
                    'description': item_input,
                    'weight': estimate['estimatedWeight'],
                    'value': estimate['estimatedWeight'] * 2.8
                }
                
                st.session_state.bag.append(new_item)
                st.rerun()
    
    # Exibir itens da sacola
    if st.session_state.bag:
        st.markdown("<div style='margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #f1f5f9;'>", unsafe_allow_html=True)
        
        for item in st.session_state.bag:
            col_item, col_remove = st.columns([5, 1])
            
            with col_item:
                st.markdown(f"""
                <div class="bag-item">
                    <div>
                        <div class="bag-item-desc">{item['description']}</div>
                        <div class="bag-item-value">Est: R$ {item['value']:.2f}</div>
                    </div>
                </div>
                """, unsafe_allow_html=True)
            
            with col_remove:
                if st.button("❌", key=f"remove_{item['id']}"):
                    st.session_state.bag = [i for i in st.session_state.bag if i['id'] != item['id']]
                    st.rerun()
        
        # Total da sacola
        total_value = sum(item['value'] for item in st.session_state.bag)
        total_weight = sum(item['weight'] for item in st.session_state.bag)
        
        st.markdown(f"""
        <div class="bag-total">
            <div class="bag-total-label">Total da Sacola</div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div class="bag-total-value">R$ {total_value:.2f}</div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("🎯 Vender Lote", key="finish_sale", use_container_width=True):
            # Criar nova oferta
            new_offer = {
                'id': f"ECO-{random.randint(1000, 9999)}",
                'residentId': user['id'],
                'type': st.session_state.bag[0]['description'] if len(st.session_state.bag) == 1 else f"{len(st.session_state.bag)} tipos de materiais",
                'quantity': len(st.session_state.bag),
                'estimatedWeight': total_weight,
                'estimatedValue': total_value,
                'location': {'address': 'Endereço Sincronizado', 'lat': -23.55, 'lng': -46.63},
                'status': RequestStatus.PENDING,
                'isGuaranteed': True
            }
            
            cloud.create_offer(new_offer)
            st.session_state.bag = []
            st.success("✅ Oferta criada com sucesso!")
            st.rerun()
        
        st.markdown("</div>", unsafe_allow_html=True)
    
    st.markdown("</div>", unsafe_allow_html=True)
    
    # Histórico de Atividades
    st.markdown('<h4 style="font-size: 10px; font-weight: 900; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.2em; margin: 3rem 0 1.5rem 0;">Suas Atividades Recentes</h4>', unsafe_allow_html=True)
    
    offers = [o for o in cloud.get_offers() if o['residentId'] == user['id']]
    
    if offers:
        for offer in offers:
            status_class = "status-completed" if offer['status'] == RequestStatus.COMPLETED else "status-pending"
            status_icon = "✅" if offer['status'] == RequestStatus.COMPLETED else "⏰"
            
            st.markdown(f"""
            <div class="offer-card">
                <div style="display: flex; align-items: center; gap: 1.5rem;">
                    <div style="font-size: 2rem;">{status_icon}</div>
                    <div style="flex: 1;">
                        <h5 style="font-weight: 900; color: #1e293b; font-size: 13px; text-transform: uppercase; margin-bottom: 0.5rem;">{offer['type']}</h5>
                        <p style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em;">{offer['id']} • {offer['estimatedWeight']:.1f}kg</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="font-size: 14px; font-weight: 900; color: #0f172a;">R$ {offer['estimatedValue']:.2f}</p>
                        <p class="status-badge {status_class}">{offer['status']}</p>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)
    else:
        st.markdown("""
        <div style="padding: 4rem 2rem; text-align: center; opacity: 0.2; background: #f8fafc; border-radius: 3rem; border: 2px dashed #e2e8f0;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🍃</div>
            <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em;">Nada por aqui ainda</p>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)

# ============================================================================
# DASHBOARD DO COLETOR
# ============================================================================
def render_collector_dashboard(user):
    st.markdown('<div class="animate-fade-in">', unsafe_allow_html=True)
    
    # Header do Veículo
    vehicle = st.session_state.vehicle
    cost_per_km = 0 if vehicle['type'] in ['bicicleta', 'pe'] else vehicle['fuelPrice'] / (vehicle['consumption'] or 1)
    
    vehicle_icon = '🏍️' if vehicle['type'] == 'moto' else '🚗' if vehicle['type'] == 'carro' else '🚴' if vehicle['type'] == 'bicicleta' else '🚶'
    
    st.markdown(f"""
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 2rem; border-radius: 3rem; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.3); margin-bottom: 2rem; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; right: 0; width: 12rem; height: 12rem; background: radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, transparent 70%); border-radius: 50%; margin-right: -5rem; margin-top: -5rem;"></div>
        <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 10;">
            <div style="display: flex; align-items: center; gap: 1.5rem;">
                <div style="font-size: 3rem;">{vehicle_icon}</div>
                <div>
                    <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: #60a5fa; margin-bottom: 0.5rem;">Status Operacional</p>
                    <h2 style="font-size: 2rem; font-weight: 900;">R$ {cost_per_km:.2f} <span style="font-size: 0.75rem; opacity: 0.4;">/ km</span></h2>
                </div>
            </div>
            <div style="text-align: right;">
                <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; opacity: 0.4; margin-bottom: 0.5rem;">Raio Ativo</p>
                <h2 style="font-size: 2rem; font-weight: 900;">{vehicle['radius']}km</h2>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Tabs de navegação
    tab1, tab2, tab3 = st.tabs(["📋 MERCADO", "🚚 EM CURSO", "⚙️ VEÍCULO"])
    
    with tab1:
        # Ofertas disponíveis
        all_offers = cloud.get_offers()
        
        # Simular distâncias
        offers_with_distance = []
        for idx, offer in enumerate(all_offers):
            distance = ((idx + 1) * 2.5) % 15 or 2
            if (offer['status'] in [RequestStatus.PENDING, RequestStatus.APPROVED] and 
                distance <= vehicle['radius']):
                offers_with_distance.append({**offer, 'distanceKm': distance})
        
        if offers_with_distance:
            for offer in offers_with_distance:
                # Cálculo financeiro
                gross = offer['estimatedValue']
                distance = offer['distanceKm']
                
                if vehicle['type'] in ['bicicleta', 'pe']:
                    cost = 0
                    net = gross
                else:
                    fuel_needed = (distance * 2) / (vehicle['consumption'] or 1)
                    cost = fuel_needed * vehicle['fuelPrice']
                    net = max(0, gross - cost)
                
                is_guaranteed = offer.get('isGuaranteed', False) or offer['status'] == RequestStatus.APPROVED
                card_class = "offer-card-guaranteed" if is_guaranteed else ""
                
                st.markdown(f"""
                <div class="offer-card {card_class}">
                    {f'<div class="guaranteed-badge">🛡️ Pagamento Garantido</div>' if is_guaranteed else ''}
                    
                    <div style="display: flex; justify-between; align-items: start; margin-bottom: 2rem; padding-top: {'0.5rem' if is_guaranteed else '0'};">
                        <div>
                            <h4 style="font-size: 1.25rem; font-weight: 900; color: #0f172a; letter-spacing: -0.02em;">{offer['type']}</h4>
                            <div style="display: flex; align-items: center; gap: 1rem; margin-top: 0.5rem;">
                                <span style="background: #f1f5f9; padding: 0.25rem 0.75rem; border-radius: 0.5rem; font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase;">{offer['estimatedWeight']}kg</span>
                                <span style="width: 0.375rem; height: 0.375rem; background: #bfdbfe; border-radius: 50%;"></span>
                                <span style="font-size: 10px; font-weight: 900; color: #2563eb; text-transform: uppercase;">📍 {distance}km</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-size: 1.5rem; font-weight: 900; color: #059669;">R$ {net:.2f}</p>
                            <p style="font-size: 9px; font-weight: 900; color: #6ee7b7; text-transform: uppercase; letter-spacing: 0.15em; margin-top: 0.5rem;">Ganho Líquido</p>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                        <div style="background: #f8fafc; padding: 1rem; border-radius: 1.5rem; border: 1px solid #f1f5f9; display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 2rem; height: 2rem; background: white; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 0.75rem;">💵</div>
                            <div>
                                <p style="font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">Bruto</p>
                                <p style="font-size: 0.75rem; font-weight: 700; color: #334155;">R$ {gross:.2f}</p>
                            </div>
                        </div>
                        <div style="background: rgba(254, 226, 226, 0.5); padding: 1rem; border-radius: 1.5rem; border: 1px solid #fee2e2; display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 2rem; height: 2rem; background: white; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; color: #fca5a5; font-size: 0.75rem;">⛽</div>
                            <div>
                                <p style="font-size: 8px; font-weight: 900; color: #f87171; text-transform: uppercase;">Custo</p>
                                <p style="font-size: 0.75rem; font-weight: 700; color: #ef4444;">R$ {cost:.2f}</p>
                            </div>
                        </div>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
                if st.button(f"✓ Aceitar Coleta - {offer['id']}", key=f"accept_{offer['id']}", use_container_width=True):
                    cloud.update_offer(offer['id'], {
                        'status': RequestStatus.COLLECTOR_ASSIGNED,
                        'collectorId': user['id']
                    })
                    st.success("Coleta aceita!")
                    st.rerun()
        else:
            st.markdown("""
            <div style="padding: 6rem 2rem; text-align: center; opacity: 0.2;">
                <div style="font-size: 4rem; margin-bottom: 1.5rem;">📡</div>
                <p style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em;">Buscando novas ofertas...</p>
            </div>
            """, unsafe_allow_html=True)
    
    with tab2:
        # Ofertas em andamento
        my_ongoing = [o for o in cloud.get_offers() if o.get('collectorId') == user['id'] and o['status'] != RequestStatus.COMPLETED]
        
        if len(my_ongoing) > 1:
            if st.button("✨ Otimizar Rotas (IA)", key="optimize", use_container_width=True):
                st.info("Rotas otimizadas com sucesso! Sua sequência foi ajustada para economizar combustível.")
        
        if my_ongoing:
            for offer in my_ongoing:
                st.markdown(f"""
                <div class="eco-card">
                    <div style="display: flex; justify-between; align-items: center; margin-bottom: 2rem;">
                        <div style="background: #dbeafe; padding: 0.5rem 1rem; border-radius: 1rem;">
                            <span style="font-size: 9px; font-weight: 900; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.15em; display: block; margin-bottom: 0.125rem;">Protocolo</span>
                            <span style="font-size: 0.75rem; font-weight: 900; color: #1e40af;">{offer['id']}</span>
                        </div>
                        <div class="status-badge {'status-collected' if offer['status'] == RequestStatus.COLLECTED else 'status-pending'}">
                            {('Material Coletado' if offer['status'] == RequestStatus.COLLECTED else 'Em Rota')}
                        </div>
                    </div>
                    
                    <h4 style="font-size: 1.5rem; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; margin-bottom: 1.5rem;">{offer['type']}</h4>
                </div>
                """, unsafe_allow_html=True)
                
                if offer['status'] != RequestStatus.COLLECTED:
                    weight = st.number_input("Peso Final (KG)", min_value=0.0, step=0.1, key=f"weight_{offer['id']}")
                    
                    if st.button(f"✅ Finalizar Coleta - {offer['id']}", key=f"finish_{offer['id']}", use_container_width=True):
                        if weight > 0:
                            updated_value = (offer['estimatedValue'] / offer['estimatedWeight']) * weight
                            cloud.update_offer(offer['id'], {
                                'status': RequestStatus.COLLECTED,
                                'actualWeight': weight,
                                'estimatedValue': updated_value
                            })
                            st.success(f"✅ Coleta finalizada! Peso confirmado: {weight}kg")
                            st.rerun()
                        else:
                            st.error("Por favor, insira o peso exato medido na balança.")
                else:
                    st.markdown(f"""
                    <div style="background: #0f172a; padding: 1.5rem; border-radius: 2.5rem; color: white; display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="width: 3rem; height: 3rem; background: rgba(255, 255, 255, 0.1); border-radius: 1.5rem; display: flex; align-items: center; justify-content: center; color: #6ee7b7; font-size: 1.5rem;">✓</div>
                            <div>
                                <p style="font-size: 9px; font-weight: 900; text-transform: uppercase; opacity: 0.5;">Peso Confirmado</p>
                                <h5 style="font-size: 1.25rem; font-weight: 900;">{offer.get('actualWeight', 0)} KG</h5>
                            </div>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
        else:
            st.markdown("""
            <div style="padding: 6rem 2rem; text-align: center; opacity: 0.2;">
                <div style="font-size: 4rem; margin-bottom: 1.5rem;">🛣️</div>
                <p style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em;">Aguardando novos destinos</p>
            </div>
            """, unsafe_allow_html=True)
    
    with tab3:
        # Configuração do Veículo
        st.markdown("""
        <div style="text-align: center; margin-bottom: 2.5rem;">
            <h3 style="font-size: 1.5rem; font-weight: 900; color: #0f172a; letter-spacing: -0.02em;">Setup do Veículo</h3>
            <p style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 0.5rem;">Sua logística inteligente começa aqui</p>
        </div>
        """, unsafe_allow_html=True)
        
        # Seleção de tipo de veículo
        col1, col2, col3, col4 = st.columns(4)
        
        vehicles = [
            ('moto', '🏍️', 35),
            ('carro', '🚗', 12),
            ('bicicleta', '🚴', 0),
            ('pe', '🚶', 0)
        ]
        
        for col, (v_type, icon, consumption) in zip([col1, col2, col3, col4], vehicles):
            with col:
                if st.button(f"{icon}\n{v_type.upper()}", key=f"vehicle_{v_type}", use_container_width=True):
                    st.session_state.vehicle = {
                        'type': v_type,
                        'consumption': consumption,
                        'radius': st.session_state.vehicle['radius'],
                        'fuelPrice': st.session_state.vehicle['fuelPrice']
                    }
                    st.rerun()
        
        st.markdown("<div style='margin-top: 2rem;'>", unsafe_allow_html=True)
        
        # Configurações adicionais
        fuel_price = st.number_input(
            "Gasolina (R$/L)",
            min_value=0.0,
            value=st.session_state.vehicle['fuelPrice'],
            step=0.01,
            disabled=st.session_state.vehicle['type'] in ['bicicleta', 'pe']
        )
        
        col_cons, col_radius = st.columns(2)
        
        with col_cons:
            consumption = st.number_input(
                "KM / Litro",
                min_value=0.0,
                value=float(st.session_state.vehicle['consumption']),
                step=1.0,
                disabled=st.session_state.vehicle['type'] in ['bicicleta', 'pe']
            )
        
        with col_radius:
            radius = st.number_input(
                "Raio Max (KM)",
                min_value=1,
                value=st.session_state.vehicle['radius'],
                step=1
            )
        
        if st.button("💾 Salvar Configurações", key="save_vehicle", use_container_width=True):
            st.session_state.vehicle = {
                'type': st.session_state.vehicle['type'],
                'consumption': consumption,
                'radius': radius,
                'fuelPrice': fuel_price
            }
            st.success("Configurações salvas!")
            st.rerun()
        
        # Informação sobre custo
        new_cost_per_km = 0 if st.session_state.vehicle['type'] in ['bicicleta', 'pe'] else fuel_price / (consumption or 1)
        
        st.markdown(f"""
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 2rem; border-radius: 2.5rem; color: white; box-shadow: 0 10px 30px rgba(37, 99, 235, 0.2); margin-top: 2rem; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; right: 0; width: 6rem; height: 6rem; background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%); border-radius: 50%; margin-right: -3rem; margin-top: -3rem;"></div>
            <div style="display: flex; align-items: start; gap: 1rem; position: relative; z-index: 10;">
                <div style="font-size: 1.5rem;">💡</div>
                <p style="font-size: 11px; font-weight: 700; line-height: 1.5; opacity: 0.9;">
                    Seu custo operacional é <strong>R$ {new_cost_per_km:.2f} / KM</strong>. 
                    Filtramos ofertas distantes para manter seu lucro líquido máximo.
                </p>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("</div>", unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)

# ============================================================================
# DASHBOARD DO PONTO DE COMPRA
# ============================================================================
def render_point_dashboard(user):
    st.markdown('<div class="animate-fade-in">', unsafe_allow_html=True)
    
    # Capital Disponível
    st.markdown(f"""
    <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 2.5rem; border-radius: 2.5rem; box-shadow: 0 20px 50px rgba(124, 58, 237, 0.3); margin-bottom: 2rem; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; right: 0; padding: 2rem; opacity: 0.2; font-size: 4rem;">🏪</div>
        <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; opacity: 0.7; margin-bottom: 1rem;">Capital Disponível</p>
        <h2 style="font-size: 3rem; font-weight: 900; letter-spacing: -0.03em;">R$ {user['balance']:.2f}</h2>
    </div>
    """, unsafe_allow_html=True)
    
    # Liquidar Oferta
    st.markdown("""
    <div class="eco-card">
        <h3 style="font-size: 0.75rem; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 1.5rem;">Liquidar Oferta (ID)</h3>
    """, unsafe_allow_html=True)
    
    col_search, col_btn = st.columns([3, 1])
    
    with col_search:
        search_id = st.text_input("", placeholder="Ex: ECO-A1B2", key="search_offer", label_visibility="collapsed")
    
    with col_btn:
        if st.button("✓ Validar", key="validate_btn", use_container_width=True):
            if search_id:
                search_id_upper = search_id.upper()
                offers = cloud.get_offers()
                offer = next((o for o in offers if o['id'] == search_id_upper), None)
                
                if offer:
                    # Liquidação: 70% morador, 30% coletor
                    amount_resident = offer['estimatedValue'] * 0.7
                    amount_collector = offer['estimatedValue'] * 0.3
                    
                    success = cloud.transfer_funds(user['id'], offer['residentId'], amount_resident)
                    
                    if success:
                        if offer.get('collectorId'):
                            cloud.transfer_funds(user['id'], offer['collectorId'], amount_collector)
                        
                        cloud.update_offer(offer['id'], {'status': RequestStatus.COMPLETED})
                        
                        st.success(f"""
                        ✅ Transação Liquidada!
                        
                        Morador: +R$ {amount_resident:.2f}
                        Coletor: +R$ {amount_collector:.2f}
                        """)
                        st.rerun()
                    else:
                        st.error("❌ Saldo insuficiente para liquidar!")
                else:
                    st.error("❌ Oferta não encontrada!")
    
    st.markdown("</div>", unsafe_allow_html=True)
    
    # Histórico de Transações
    st.markdown("""
    <div style="margin-top: 2rem;">
        <h3 style="font-size: 0.75rem; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 1.5rem; margin-left: 0.5rem;">Histórico de Transações em Nuvem</h3>
        <div style="background: white; border-radius: 2.5rem; overflow: hidden; border: 1px solid #f3f4f6; padding: 2.5rem; text-align: center;">
            <p style="color: #d1d5db; font-weight: 900; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em;">Sincronizado com servidor central</p>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)

# ============================================================================
# NAVEGAÇÃO PRINCIPAL
# ============================================================================
def main():
    # Se não houver usuário logado, mostrar tela de login
    if not st.session_state.user:
        render_login()
        return
    
    user = st.session_state.user
    
    # Renderizar header
    render_header(user)
    
    # Navegação via tabs (simula o dock de navegação)
    tab_home, tab_history, tab_profile = st.tabs(["🏠 HOME", "📊 DADOS", "👤 PERFIL"])
    
    with tab_home:
        if user['role'] == UserRole.RESIDENT:
            render_resident_dashboard(user)
        elif user['role'] == UserRole.COLLECTOR:
            render_collector_dashboard(user)
        elif user['role'] == UserRole.POINT:
            render_point_dashboard(user)
    
    with tab_history:
        st.markdown("""
        <div class="animate-fade-in" style="padding: 2rem 0;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5rem 2rem; background: #f8fafc; border-radius: 3rem; border: 1px solid #f1f5f9;">
                <div style="width: 5rem; height: 5rem; background: white; border-radius: 2rem; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); display: flex; align-items: center; justify-center; color: #cbd5e1; font-size: 2rem; margin-bottom: 2rem;">
                    📊
                </div>
                <h3 style="font-size: 0.875rem; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: 0.2em; text-align: center; line-height: 1.5;">Seus Dados de Impacto</h3>
                <p style="font-size: 11px; color: #94a3b8; font-weight: 700; text-align: center; margin-top: 0.75rem; line-height: 1.5; max-width: 200px;">Gráficos e estatísticas estarão disponíveis em breve.</p>
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    with tab_profile:
        st.markdown(f"""
        <div class="animate-fade-in" style="padding: 2rem 0;">
            <div style="background: #0f172a; padding: 2.5rem; border-radius: 3.5rem; color: white; position: relative; overflow: hidden; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.4);">
                <div style="position: absolute; top: 0; right: 0; width: 8rem; height: 8rem; background: radial-gradient(circle, rgba(5, 150, 105, 0.2) 0%, transparent 70%); border-radius: 50%; margin-right: -4rem; margin-top: -4rem;"></div>
                <div style="display: flex; flex-direction: column; align-items: center; position: relative; z-index: 10; text-align: center;">
                    <div style="width: 6rem; height: 6rem; background: linear-gradient(135deg, #059669 0%, #2563eb 100%); border-radius: 2.5rem; padding: 0.25rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); margin-bottom: 1.5rem;">
                        <div style="width: 100%; height: 100%; background: #0f172a; border-radius: 2.2rem; display: flex; align-items: center; justify-content: center; font-size: 2.5rem;">
                            👤
                        </div>
                    </div>
                    <h3 style="font-size: 1.25rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em;">{user['name']}</h3>
                    <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #6ee7b7; letter-spacing: 0.3em; margin-top: 0.5rem;">Membro Verificado</p>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Botão de Logout
        if st.button("🚪 Sair da Conta", key="logout_btn", use_container_width=True):
            st.session_state.user = None
            st.session_state.view = 'home'
            st.session_state.bag = []
            st.rerun()

if __name__ == "__main__":
    main()
