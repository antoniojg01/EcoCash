import streamlit as st
import streamlit.components.v1 as components
from pathlib import Path

# Configuração da página
st.set_page_config(
    page_title="EcoCash Platform",
    page_icon="♻️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Carregar CSS customizado
def load_css():
    css_file = Path(__file__).parent / "assets" / "styles.css"
    if css_file.exists():
        with open(css_file) as f:
            st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)
    else:
        # CSS inline se o arquivo não existir
        st.markdown(get_inline_css(), unsafe_allow_html=True)

def get_inline_css():
    return """
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        /* Remove elementos padrão do Streamlit */
        #MainMenu, footer, header, .stDeployButton {
            visibility: hidden !important;
            display: none !important;
            height: 0 !important;
        }
        
        .main .block-container {
            padding: 0 !important;
            max-width: 100% !important;
        }
        
        .stApp {
            background-color: #ffffff;
        }
        
        /* Container principal com padding para mobile */
        .app-container {
            max-width: 428px;
            margin: 0 auto;
            min-height: 100vh;
            background: #ffffff;
            position: relative;
            padding-bottom: 10rem;
        }
        
        /* ========== HEADER GLOBAL (FIEL AO ORIGINAL) ========== */
        .eco-header {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            padding: 3rem 1.5rem 2.5rem 1.5rem;
            border-radius: 0 0 3.5rem 3.5rem;
            box-shadow: 0 20px 60px rgba(5, 150, 105, 0.15);
            position: relative;
            overflow: hidden;
            margin-bottom: 0;
        }
        
        .eco-header::before {
            content: '';
            position: absolute;
            top: -100px;
            right: -100px;
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
            border-radius: 50%;
        }
        
        .eco-header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            z-index: 10;
        }
        
        .eco-header-left {
            animation: fadeIn 0.6s ease-out;
        }
        
        .eco-header-subtitle {
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            color: rgba(167, 243, 208, 0.6);
            letter-spacing: 0.2em;
            margin-bottom: 0.375rem;
        }
        
        .eco-header-name {
            font-size: 1.25rem;
            font-weight: 900;
            color: #ffffff;
            line-height: 1.2;
            letter-spacing: -0.02em;
        }
        
        .eco-header-right {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .eco-balance {
            background: rgba(255, 255, 255, 0.15);
            padding: 0.625rem 1.25rem;
            border-radius: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(12px);
        }
        
        .eco-balance span {
            color: #ffffff;
            font-weight: 900;
            font-size: 0.75rem;
        }
        
        .eco-logout-btn {
            width: 2.75rem;
            height: 2.75rem;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .eco-logout-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(0.95);
        }
        
        .eco-logout-btn i {
            font-size: 0.875rem;
        }
        
        /* ========== ÁREA DE CONTEÚDO ========== */
        .main-content {
            flex: 1;
            overflow-y: auto;
            padding: 2rem 1.5rem 8rem 1.5rem;
            -webkit-overflow-scrolling: touch;
        }
        
        .main-content::-webkit-scrollbar {
            display: none;
        }
        
        /* ========== DOCK DE NAVEGAÇÃO (FIEL AO ORIGINAL) ========== */
        .nav-dock-container {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 0 1.5rem 2rem 1.5rem;
            z-index: 999;
            pointer-events: none;
        }
        
        .nav-dock {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            border-radius: 2.8rem;
            height: 6rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 2.5rem;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(226, 232, 240, 0.5);
            pointer-events: all;
            max-width: 428px;
            margin: 0 auto;
        }
        
        .nav-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            min-width: 4rem;
            position: relative;
        }
        
        .nav-button-inner {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.375rem;
        }
        
        .nav-button.inactive .nav-button-inner {
            opacity: 0.2;
        }
        
        .nav-button:hover.inactive .nav-button-inner {
            opacity: 0.4;
        }
        
        .nav-icon-container {
            width: 3.5rem;
            height: 3.5rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .nav-button.active .nav-icon-container {
            background: #059669;
            color: #ffffff;
            box-shadow: 0 10px 30px rgba(5, 150, 105, 0.25);
            transform: scale(1);
        }
        
        .nav-button.inactive .nav-icon-container {
            background: transparent;
            color: #64748b;
        }
        
        .nav-icon-container i {
            font-size: 1.125rem;
        }
        
        .nav-label-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: 0.25rem;
        }
        
        .nav-label {
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 0.15em;
            transition: color 0.4s ease;
        }
        
        .nav-button.active .nav-label {
            color: #047857;
        }
        
        .nav-button.inactive .nav-label {
            color: #64748b;
        }
        
        .nav-indicator {
            width: 0.25rem;
            height: 0.25rem;
            background: #059669;
            border-radius: 50%;
            margin-top: 0.25rem;
            animation: fadeIn 0.3s ease-out;
        }
        
        /* ========== CARDS E COMPONENTES ========== */
        .eco-card {
            background: #ffffff;
            padding: 2rem;
            border-radius: 3rem;
            border: 1px solid #f1f5f9;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.05);
            margin-bottom: 2rem;
            animation: slideUp 0.5s ease-out;
        }
        
        .eco-card-icon {
            width: 4rem;
            height: 4rem;
            background: #f0fdf4;
            border-radius: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin: 0 auto 1.5rem;
            box-shadow: inset 0 2px 10px rgba(5, 150, 105, 0.08);
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
        
        /* ========== INPUTS (ESTILO ORIGINAL) ========== */
        .eco-input-group {
            display: flex;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
        }
        
        .eco-input {
            flex: 1;
            background: #f8fafc;
            border: 2px solid transparent;
            padding: 1.25rem 1.5rem;
            border-radius: 1.8rem;
            font-weight: 700;
            font-size: 0.875rem;
            outline: none;
            transition: all 0.3s ease;
            font-family: 'Inter', sans-serif;
        }
        
        .eco-input::placeholder {
            color: #cbd5e1;
        }
        
        .eco-input:focus {
            border-color: #059669;
            background: #ffffff;
        }
        
        .eco-btn-icon {
            width: 4rem;
            height: 4rem;
            background: #0f172a;
            color: #ffffff;
            border: none;
            border-radius: 1.8rem;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1rem;
        }
        
        .eco-btn-icon:hover {
            transform: scale(0.95);
            background: #1e293b;
        }
        
        .eco-btn-icon:disabled {
            opacity: 0.2;
            cursor: not-allowed;
        }
        
        /* ========== SACOLA ITEMS ========== */
        .bag-items-container {
            max-height: 12rem;
            overflow-y: auto;
            padding-right: 0.25rem;
            margin-bottom: 1rem;
        }
        
        .bag-items-container::-webkit-scrollbar {
            width: 4px;
        }
        
        .bag-items-container::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
        }
        
        .bag-items-container::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }
        
        .bag-item {
            background: rgba(248, 250, 252, 0.8);
            padding: 1rem 1.25rem;
            border-radius: 1.25rem;
            border: 1px solid rgba(226, 232, 240, 0.5);
            margin-bottom: 0.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            animation: slideUp 0.3s ease-out;
        }
        
        .bag-item-content {
            flex: 1;
            min-width: 0;
            margin-right: 1rem;
        }
        
        .bag-item-desc {
            font-size: 11px;
            font-weight: 900;
            color: #334155;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .bag-item-value {
            font-size: 9px;
            font-weight: 700;
            color: #059669;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 0.25rem;
        }
        
        .bag-item-remove {
            width: 2rem;
            height: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #cbd5e1;
            cursor: pointer;
            transition: color 0.2s ease;
            background: none;
            border: none;
            font-size: 0.875rem;
        }
        
        .bag-item-remove:hover {
            color: #ef4444;
        }
        
        /* ========== TOTAL DA SACOLA ========== */
        .bag-total {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            padding: 1.5rem 2rem;
            border-radius: 2.5rem;
            color: #ffffff;
            margin-top: 1.5rem;
            box-shadow: 0 20px 50px rgba(5, 150, 105, 0.2);
        }
        
        .bag-total-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
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
            font-size: 1.5rem;
            font-weight: 900;
        }
        
        .bag-total-btn {
            background: #ffffff;
            color: #059669;
            padding: 1rem 1.5rem;
            border-radius: 1rem;
            font-weight: 900;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 1rem;
            width: 100%;
        }
        
        .bag-total-btn:hover {
            transform: scale(0.98);
        }
        
        /* ========== ANIMAÇÕES ========== */
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .animate-fade-in {
            animation: fadeIn 0.6s ease-out;
        }
        
        .animate-slide-up {
            animation: slideUp 0.5s ease-out;
        }
        
        /* ========== RESPONSIVIDADE ========== */
        @media (max-width: 428px) {
            .app-container {
                max-width: 100%;
            }
            
            .eco-header {
                padding: 2.5rem 1.25rem 2rem 1.25rem;
            }
            
            .main-content {
                padding: 1.5rem 1.25rem 8rem 1.25rem;
            }
            
            .nav-dock {
                padding: 0 1.5rem;
            }
        }
        
        /* Esconde elementos do Streamlit que possam interferir */
        .stTextInput > div > div > input,
        .stNumberInput > div > div > input,
        .stButton > button {
            all: unset;
        }
        
        iframe {
            display: none;
        }
    </style>
    """

# Inicializar o CSS
load_css()

# Importar módulos (criaremos a seguir)
from services.cloud_service import CloudService, UserRole, RequestStatus
from services.ai_service import estimate_weight_and_value
from components.login import render_login
from components.header import render_header
from components.navigation import render_navigation
from components.resident_view import render_resident_dashboard
from components.collector_view import render_collector_dashboard
from components.point_view import render_point_dashboard

# Inicializar session state
if 'cloud' not in st.session_state:
    st.session_state.cloud = CloudService()

if 'user' not in st.session_state:
    st.session_state.user = None

if 'view' not in st.session_state:
    st.session_state.view = 'home'

if 'bag' not in st.session_state:
    st.session_state.bag = []

# Função principal
def main():
    # Tela de Login
    if not st.session_state.user:
        render_login()
        return
    
    # Container principal
    st.markdown('<div class="app-container">', unsafe_allow_html=True)
    
    # Header
    render_header(st.session_state.user)
    
    # Conteúdo principal
    st.markdown('<div class="main-content animate-fade-in">', unsafe_allow_html=True)
    
    if st.session_state.view == 'home':
        if st.session_state.user['role'] == UserRole.RESIDENT:
            render_resident_dashboard(st.session_state.user)
        elif st.session_state.user['role'] == UserRole.COLLECTOR:
            render_collector_dashboard(st.session_state.user)
        elif st.session_state.user['role'] == UserRole.POINT:
            render_point_dashboard(st.session_state.user)
    
    elif st.session_state.view == 'history':
        st.markdown("""
        <div class="eco-card" style="text-align: center; padding: 5rem 2rem;">
            <div class="eco-card-icon">📊</div>
            <h3 class="eco-card-title">Seus Dados de Impacto</h3>
            <p class="eco-card-subtitle">Gráficos e estatísticas disponíveis em breve</p>
        </div>
        """, unsafe_allow_html=True)
    
    elif st.session_state.view == 'profile':
        user = st.session_state.user
        st.markdown(f"""
        <div class="eco-card" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; text-align: center; padding: 2.5rem; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -2rem; right: -2rem; width: 8rem; height: 8rem; background: radial-gradient(circle, rgba(5, 150, 105, 0.2) 0%, transparent 70%); border-radius: 50%;"></div>
            <div style="position: relative; z-index: 10;">
                <div style="width: 6rem; height: 6rem; background: linear-gradient(135deg, #059669, #2563eb); border-radius: 2rem; padding: 0.25rem; margin: 0 auto 1.5rem;">
                    <div style="width: 100%; height: 100%; background: #0f172a; border-radius: 1.8rem; display: flex; align-items: center; justify-content: center; font-size: 2.5rem;">
                        <i class="fas fa-user-circle"></i>
                    </div>
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em;">{user['name']}</h3>
                <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #6ee7b7; letter-spacing: 0.3em; margin-top: 0.5rem;">Membro Verificado</p>
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Navegação (Dock)
    render_navigation()
    
    st.markdown('</div>', unsafe_allow_html=True)

if __name__ == "__main__":
    main()
from enum import Enum
from typing import List, Dict, Optional
import streamlit as st

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

class CloudService:
    """
    Serviço de nuvem que replica o cloudService.ts original
    Gerencia usuários, ofertas e transações
    """
    
    def __init__(self):
        if 'cloud_db' not in st.session_state:
            st.session_state.cloud_db = {
                'users': [
                    {
                        'id': 'u_resident',
                        'name': 'João Silva',
                        'role': UserRole.RESIDENT,
                        'balance': 50.00,
                        'totalRecycledKg': 12.5
                    },
                    {
                        'id': 'u_collector',
                        'name': 'Carlos Coletor',
                        'role': UserRole.COLLECTOR,
                        'balance': 142.50,
                        'totalRecycledKg': 45.0
                    },
                    {
                        'id': 'u_point',
                        'name': 'EcoPoint Central',
                        'role': UserRole.POINT,
                        'balance': 1250.00,
                        'totalRecycledKg': 1200.0
                    }
                ],
                'offers': [
                    {
                        'id': 'ECO-9921',
                        'residentId': 'u_resident',
                        'type': 'PET',
                        'quantity': 1,
                        'estimatedWeight': 8.0,
                        'estimatedValue': 14.40,
                        'location': {
                            'address': 'Rua das Flores, 55',
                            'lat': -23.55,
                            'lng': -46.63
                        },
                        'status': RequestStatus.APPROVED,
                        'isGuaranteed': True
                    }
                ]
            }
    
    def get_users(self) -> List[Dict]:
        """Retorna todos os usuários"""
        return st.session_state.cloud_db['users']
    
    def get_user(self, user_id: str) -> Optional[Dict]:
        """Busca usuário por ID"""
        for user in st.session_state.cloud_db['users']:
            if user['id'] == user_id:
                return user
        return None
    
    def update_user(self, user_id: str, data: Dict):
        """Atualiza dados do usuário"""
        for i, user in enumerate(st.session_state.cloud_db['users']):
            if user['id'] == user_id:
                st.session_state.cloud_db['users'][i].update(data)
                # Atualiza o usuário logado se for o mesmo
                if st.session_state.user and st.session_state.user['id'] == user_id:
                    st.session_state.user.update(data)
                break
    
    def get_offers(self) -> List[Dict]:
        """Retorna todas as ofertas"""
        return st.session_state.cloud_db['offers']
    
    def create_offer(self, offer: Dict):
        """Cria nova oferta"""
        st.session_state.cloud_db['offers'].append(offer)
    
    def update_offer(self, offer_id: str, data: Dict):
        """Atualiza oferta existente"""
        for i, offer in enumerate(st.session_state.cloud_db['offers']):
            if offer['id'] == offer_id:
                st.session_state.cloud_db['offers'][i].update(data)
                break
    
    def transfer_funds(self, from_id: str, to_id: str, amount: float) -> bool:
        """Transfere fundos entre usuários"""
        from_user = self.get_user(from_id)
        to_user = self.get_user(to_id)
        
        if from_user and to_user and from_user['balance'] >= amount:
            self.update_user(from_id, {'balance': from_user['balance'] - amount})
            self.update_user(to_id, {'balance': to_user['balance'] + amount})
            return True
        return False
import streamlit as st
import random
from services.cloud_service import RequestStatus

def render_collector_dashboard(user: dict):
    """
    Dashboard do Coletor - 100% fiel ao CollectorDashboard.tsx
    Inclui: gerenciamento de veículo, ofertas disponíveis, coletas em andamento
    """
    
    cloud = st.session_state.cloud
    
    # Inicializar configuração do veículo
    if 'vehicle' not in st.session_state:
        st.session_state.vehicle = {
            'type': 'moto',
            'consumption': 35,
            'radius': 10,
            'fuelPrice': 6.15
        }
    
    vehicle = st.session_state.vehicle
    
    # Calcular custo por km
    if vehicle['type'] in ['bicicleta', 'pe']:
        cost_per_km = 0
    else:
        cost_per_km = vehicle['fuelPrice'] / (vehicle['consumption'] or 1)
    
    # Ícone do veículo
    vehicle_icons = {
        'moto': '🏍️',
        'carro': '🚗',
        'bicicleta': '🚴',
        'pe': '🚶'
    }
    vehicle_icon = vehicle_icons.get(vehicle['type'], '🏍️')
    
    # Header do Veículo (Fiel ao original)
    st.markdown(f"""
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 2rem; border-radius: 3rem; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.3); margin-bottom: 2.5rem; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; right: 0; width: 12rem; height: 12rem; background: radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, transparent 70%); border-radius: 50%; margin-right: -5rem; margin-top: -5rem;"></div>
        <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 10;">
            <div style="display: flex; align-items: center; gap: 1.5rem;">
                <div style="font-size: 3rem;">{vehicle_icon}</div>
                <div>
                    <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: #60a5fa; margin-bottom: 0.5rem;">Status Operacional</p>
                    <h2 style="font-size: 2rem; font-weight: 900; margin: 0;">R$ {cost_per_km:.2f} <span style="font-size: 0.75rem; opacity: 0.4;">/ km</span></h2>
                </div>
            </div>
            <div style="text-align: right;">
                <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; opacity: 0.4; margin-bottom: 0.5rem;">Raio Ativo</p>
                <h2 style="font-size: 2rem; font-weight: 900; margin: 0;">{vehicle['radius']}km</h2>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Tabs de navegação (Mercado, Em Curso, Veículo)
    tab1, tab2, tab3 = st.tabs(["📋 MERCADO", "🚚 EM CURSO", "⚙️ VEÍCULO"])
    
    # ==================== TAB 1: MERCADO ====================
    with tab1:
        render_collector_market(user, vehicle, cost_per_km, cloud)
    
    # ==================== TAB 2: EM CURSO ====================
    with tab2:
        render_collector_ongoing(user, vehicle, cost_per_km, cloud)
    
    # ==================== TAB 3: VEÍCULO ====================
    with tab3:
        render_collector_vehicle(cost_per_km)


def render_collector_market(user, vehicle, cost_per_km, cloud):
    """Renderiza ofertas disponíveis no mercado"""
    
    all_offers = cloud.get_offers()
    
    # Simular distâncias e filtrar ofertas disponíveis
    offers_with_distance = []
    for idx, offer in enumerate(all_offers):
        distance = ((idx + 1) * 2.5) % 15 or 2
        
        if (offer['status'] in [RequestStatus.PENDING, RequestStatus.APPROVED] and 
            distance <= vehicle['radius'] and
            offer.get('collectorId') != user['id']):
            offers_with_distance.append({**offer, 'distanceKm': distance})
    
    if not offers_with_distance:
        st.markdown("""
        <div style="padding: 6rem 2rem; text-align: center; opacity: 0.2;">
            <div style="font-size: 4rem; margin-bottom: 1.5rem;">📡</div>
            <p style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em;">Buscando novas ofertas...</p>
        </div>
        """, unsafe_allow_html=True)
        return
    
    for offer in offers_with_distance:
        # Cálculos financeiros
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
        
        # Card da oferta (100% fiel ao design)
        st.markdown(f"""
        <div style="background: white; padding: 2rem; border-radius: 3rem; border: {'2px solid #059669' if is_guaranteed else '2px solid #f1f5f9'}; margin-bottom: 2rem; position: relative; box-shadow: {'0 10px 40px rgba(5, 150, 105, 0.1)' if is_guaranteed else '0 2px 10px rgba(0,0,0,0.02)'};">
            {f'<div style="position: absolute; top: -0.75rem; left: 2rem; background: #059669; color: white; padding: 0.5rem 1.5rem; border-radius: 9999px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; box-shadow: 0 10px 30px rgba(5, 150, 105, 0.2);"><i class="fas fa-shield-check"></i> Pagamento Garantido</div>' if is_guaranteed else ''}
            
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 2rem; padding-top: {'0.5rem' if is_guaranteed else '0'};">
                <div>
                    <h4 style="font-size: 1.25rem; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; margin-bottom: 0.75rem;">{offer['type']}</h4>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="background: #f1f5f9; padding: 0.25rem 0.75rem; border-radius: 0.5rem; font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase;">{offer['estimatedWeight']}kg</span>
                        <span style="width: 0.375rem; height: 0.375rem; background: #bfdbfe; border-radius: 50%;"></span>
                        <span style="font-size: 10px; font-weight: 900; color: #2563eb; text-transform: uppercase;"><i class="fas fa-location-dot"></i> {distance}km</span>
                    </div>
                </div>
                <div style="text-align: right;">
                    <p style="font-size: 1.5rem; font-weight: 900; color: #059669; margin: 0;">R$ {net:.2f}</p>
                    <p style="font-size: 9px; font-weight: 900; color: #6ee7b7; text-transform: uppercase; letter-spacing: 0.15em; margin-top: 0.5rem;">Ganho Líquido</p>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                <div style="background: #f8fafc; padding: 1rem; border-radius: 1.5rem; border: 1px solid #f1f5f9; display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 2rem; height: 2rem; background: white; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">💵</div>
                    <div>
                        <p style="font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin: 0;">Bruto</p>
                        <p style="font-size: 0.75rem; font-weight: 700; color: #334155; margin: 0.25rem 0 0 0;">R$ {gross:.2f}</p>
                    </div>
                </div>
                <div style="background: rgba(254, 226, 226, 0.5); padding: 1rem; border-radius: 1.5rem; border: 1px solid #fee2e2; display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 2rem; height: 2rem; background: white; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; color: #fca5a5; font-size: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">⛽</div>
                    <div>
                        <p style="font-size: 8px; font-weight: 900; color: #f87171; text-transform: uppercase; margin: 0;">Custo</p>
                        <p style="font-size: 0.75rem; font-weight: 700; color: #ef4444; margin: 0.25rem 0 0 0;">R$ {cost:.2f}</p>
                    </div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Botão de aceitar coleta
        if st.button(f"✓ Aceitar Coleta - {offer['id']}", key=f"accept_{offer['id']}", use_container_width=True):
            cloud.update_offer(offer['id'], {
                'status': RequestStatus.COLLECTOR_ASSIGNED,
                'collectorId': user['id']
            })
            st.success(f"✅ Coleta {offer['id']} aceita!")
            st.rerun()


def render_collector_ongoing(user, vehicle, cost_per_km, cloud):
    """Renderiza coletas em andamento"""
    
    my_ongoing = [o for o in cloud.get_offers() 
                  if o.get('collectorId') == user['id'] and o['status'] != RequestStatus.COMPLETED]
    
    # Botão de otimizar rotas (se houver múltiplas coletas)
    if len(my_ongoing) > 1:
        if st.button("✨ Otimizar Rotas (IA)", key="optimize_routes", use_container_width=True):
            st.info("🎯 Rotas otimizadas com sucesso! Sua sequência foi ajustada para economizar combustível e tempo.")
    
    if not my_ongoing:
        st.markdown("""
        <div style="padding: 6rem 2rem; text-align: center; opacity: 0.2;">
            <div style="font-size: 4rem; margin-bottom: 1.5rem;">🛣️</div>
            <p style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em;">Aguardando novos destinos</p>
        </div>
        """, unsafe_allow_html=True)
        return
    
    for offer in my_ongoing:
        is_collected = offer['status'] == RequestStatus.COLLECTED
        
        # Card da coleta em andamento
        st.markdown(f"""
        <div class="eco-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <div style="background: #dbeafe; padding: 0.5rem 1rem; border-radius: 1rem;">
                    <span style="font-size: 9px; font-weight: 900; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.15em; display: block; margin-bottom: 0.125rem;">Protocolo</span>
                    <span style="font-size: 0.75rem; font-weight: 900; color: #1e40af;">{offer['id']}</span>
                </div>
                <div style="padding: 0.5rem 1rem; border-radius: 1rem; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; border: 1px solid {'#a7f3d0' if is_collected else '#fde68a'}; background: {'#d1fae5' if is_collected else '#fef3c7'}; color: {'#059669' if is_collected else '#f59e0b'};">
                    {'✓ Material Coletado' if is_collected else '🔄 Em Rota'}
                </div>
            </div>
            
            <h4 style="font-size: 1.5rem; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; margin-bottom: 1.5rem;">{offer['type']}</h4>
        </div>
        """, unsafe_allow_html=True)
        
        if not is_collected:
            # Input para peso final
            weight = st.number_input(
                "Peso Final (KG)",
                min_value=0.0,
                step=0.1,
                key=f"weight_{offer['id']}",
                help="Insira o peso exato medido na balança"
            )
            
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
                    st.error("⚠️ Por favor, insira o peso exato medido na balança.")
        else:
            # Exibir peso confirmado
            st.markdown(f"""
            <div style="background: #0f172a; padding: 1.5rem; border-radius: 2.5rem; color: white; display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 3rem; height: 3rem; background: rgba(255, 255, 255, 0.1); border-radius: 1.5rem; display: flex; align-items: center; justify-content: center; color: #6ee7b7; font-size: 1.5rem;">✓</div>
                    <div>
                        <p style="font-size: 9px; font-weight: 900; text-transform: uppercase; opacity: 0.5; margin: 0;">Peso Confirmado</p>
                        <h5 style="font-size: 1.25rem; font-weight: 900; margin: 0.25rem 0 0 0;">{offer.get('actualWeight', 0)} KG</h5>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)


def render_collector_vehicle(cost_per_km):
    """Renderiza configuração do veículo"""
    
    st.markdown("""
    <div style="text-align: center; margin-bottom: 2.5rem;">
        <h3 style="font-size: 1.5rem; font-weight: 900; color: #0f172a; letter-spacing: -0.02em;">Setup do Veículo</h3>
        <p style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 0.5rem;">Sua logística inteligente começa aqui</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Seleção de tipo de veículo
    st.markdown("### Tipo de Veículo")
    
    col1, col2, col3, col4 = st.columns(4)
    
    vehicles = [
        ('moto', '🏍️', 35, col1),
        ('carro', '🚗', 12, col2),
        ('bicicleta', '🚴', 0, col3),
        ('pe', '🚶', 0, col4)
    ]
    
    current_type = st.session_state.vehicle['type']
    
    for v_type, icon, consumption, col in vehicles:
        with col:
            is_active = (current_type == v_type)
            
            if st.button(
                f"{icon}\n{v_type.upper()}",
                key=f"vehicle_{v_type}",
                use_container_width=True,
                type="primary" if is_active else "secondary"
            ):
                st.session_state.vehicle['type'] = v_type
                st.session_state.vehicle['consumption'] = consumption
                st.rerun()
    
    st.markdown("---")
    
    # Configurações de combustível e raio
    fuel_disabled = st.session_state.vehicle['type'] in ['bicicleta', 'pe']
    
    st.markdown("### Configurações")
    
    fuel_price = st.number_input(
        "💰 Gasolina (R$/L)",
        min_value=0.0,
        value=st.session_state.vehicle['fuelPrice'],
        step=0.01,
        disabled=fuel_disabled,
        key="fuel_price_input"
    )
    
    col_cons, col_radius = st.columns(2)
    
    with col_cons:
        consumption = st.number_input(
            "⛽ KM / Litro",
            min_value=0.0,
            value=float(st.session_state.vehicle['consumption']),
            step=1.0,
            disabled=fuel_disabled,
            key="consumption_input"
        )
    
    with col_radius:
        radius = st.number_input(
            "📍 Raio Max (KM)",
            min_value=1,
            value=st.session_state.vehicle['radius'],
            step=1,
            key="radius_input"
        )
    
    if st.button("💾 Salvar Configurações", key="save_vehicle", use_container_width=True):
        st.session_state.vehicle.update({
            'fuelPrice': fuel_price,
            'consumption': consumption,
            'radius': radius
        })
        st.success("✅ Configurações salvas com sucesso!")
        st.rerun()
    
    # Informação sobre custo operacional
    new_cost = 0 if st.session_state.vehicle['type'] in ['bicicleta', 'pe'] else fuel_price / (consumption or 1)
    
    st.markdown(f"""
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 2rem; border-radius: 2.5rem; color: white; box-shadow: 0 10px 30px rgba(37, 99, 235, 0.2); margin-top: 2rem; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; right: 0; width: 6rem; height: 6rem; background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%); border-radius: 50%; margin-right: -3rem; margin-top: -3rem;"></div>
        <div style="display: flex; align-items: start; gap: 1rem; position: relative; z-index: 10;">
            <div style="font-size: 1.5rem;">💡</div>
            <p style="font-size: 11px; font-weight: 700; line-height: 1.6; opacity: 0.9; margin: 0;">
                Seu custo operacional é <strong>R$ {new_cost:.2f} / KM</strong>. 
                Filtramos ofertas distantes para manter seu lucro líquido máximo.
            </p>
        </div>
    </div>
    """, unsafe_allow_html=True)

