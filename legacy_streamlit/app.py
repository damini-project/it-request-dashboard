import streamlit as st
from datetime import datetime, timedelta
import database as db
import utils
from view_dashboard import show_dashboard
from view_guide import show_guide

# Page configuration
st.set_page_config(layout="wide", page_title="IT Analytics Dashboard")

# Global CSS for consistent Black Theme and UI styling
st.markdown("""
    <style>
    .stApp { background-color: #0E1117; color: #FFFFFF; }
    
    /* Sidebar styling */
    [data-testid="stSidebar"] {
        background-color: #161B22;
        border-right: 1px solid #30363D;
    }
    
    /* Hide radio button labels for a cleaner menu look if needed, but here we keep them */
    
    /* KPI Cards and other components */
    .stTabs [data-baseweb="tab-list"] {
        gap: 24px;
    }
    .stTabs [data-baseweb="tab"] {
        height: 50px;
        white-space: pre-wrap;
        background-color: transparent;
        border-radius: 4px 4px 0px 0px;
        gap: 1px;
        padding-top: 10px;
        padding-bottom: 10px;
    }
    
    .kpi-card { background: #1E1E1E; padding: 20px; border-radius: 15px; border: 1px solid #262730; text-align: center; }
    
    .profile-card {
        padding: 15px;
        background-color: #1E1E1E;
        border-radius: 12px;
        border: 1px solid #30363D;
        margin-top: 20px;
    }
    </style>
    """, unsafe_allow_html=True)

# Database initialization
db.init_db()

# --- Sidebar Navigation ---
st.sidebar.title("🖥️ IT 관리 시스템")
st.sidebar.markdown("---")

menu = st.sidebar.radio(
    "Navigation",
    ["📊 대시보드", "📋 요청 목록", "🤖 AI 분석", "📊 통계", "⚙️ 설정"],
    index=0,
    label_visibility="collapsed"
)

st.sidebar.markdown("---")

# Data Upload and Date Filter in Sidebar (below menu)
uploaded = st.sidebar.file_uploader("📂 데이터 업로드", type=["csv", "xlsx", "xls"])
if uploaded and st.session_state.get('file') != uploaded.name:
    df = utils.load_file(uploaded)
    if df is not None:
        db.insert_data(df)
        st.session_state['file'] = uploaded.name
        st.rerun()

st.sidebar.markdown("### 📅 기간 설정")
start_date = st.sidebar.date_input("시작일", datetime.now() - timedelta(30)).strftime("%Y%m%d")
end_date = st.sidebar.date_input("종료일", datetime.now()).strftime("%Y%m%d")

# Sidebar User Profile at the bottom
st.sidebar.markdown("---")
st.sidebar.markdown("""
    <div class='profile-card'>
        <div style='color: #8B949E; font-size: 0.8em; margin-bottom: 5px;'>현재 접속자</div>
        <div style='color: #C9D1D9; font-weight: bold; font-size: 1.1em;'>👤 이준혁 | 개발팀</div>
    </div>
    """, unsafe_allow_html=True)


# --- Main Content Logic ---
if menu == "📊 대시보드":
    st.header("📊 IT 지원 대시보드")
    show_dashboard(start_date, end_date)

elif menu == "📋 요청 목록":
    st.header("📋 IT 요청 쿼리 가이드")
    show_guide(start_date, end_date)

elif menu == "🤖 AI 분석":
    st.header("🤖 AI 분석 리포트")
    st.info("준비 중인 기능입니다.")

elif menu == "📊 통계":
    st.header("📊 세부 통계")
    st.info("준비 중인 기능입니다.")

elif menu == "⚙️ 설정":
    st.header("⚙️ 시스템 설정")
    st.info("준비 중인 기능입니다.")
