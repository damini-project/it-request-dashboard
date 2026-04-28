import streamlit as st
import pandas as pd
import database as db
import plotly.express as px

PART_MAP = {
    "01": "생산기획", "02": "영업물류", "03": "인사", "04": "회계", 
    "05": "팀장", "06": "기타", "07": "개발"
}

def show_dashboard(start, end):
    st.markdown("""
        <style>
        .kpi-card { background: #1A1C23; padding: 20px; border-radius: 15px; border: 1px solid #2D2F39; text-align: center; }
        .kpi-title { font-size: 0.9em; color: #808495; }
        .kpi-value { font-size: 1.8em; font-weight: bold; margin: 5px 0; color: white; }
        .ai-card { background: #1A1C23; padding: 20px; border-radius: 12px; border: 1px solid #2D2F39; }
        .tag { background: #2D2F39; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; margin-right: 5px; color: #A0A0A0; }
        </style>
    """, unsafe_allow_html=True)

    # 1. KPI Cards
    total, comp, pend = db.get_stats(start, end)
    c1, c2, c3, c4 = st.columns(4)
    c1.markdown(f"<div class='kpi-card'><div class='kpi-title'>총 요청</div><div class='kpi-value'>{total}</div><div class='kpi-title'>전체의 100%</div></div>", unsafe_allow_html=True)
    c2.markdown(f"<div class='kpi-card'><div class='kpi-title'>처리완료</div><div class='kpi-value' style='color:#32D74B'>{comp}</div><div class='kpi-title'>진척도 {int(comp/total*100) if total>0 else 0}%</div></div>", unsafe_allow_html=True)
    c3.markdown(f"<div class='kpi-card'><div class='kpi-title'>진행중</div><div class='kpi-value' style='color:#FFD60A'>{pend}</div><div class='kpi-title'>실시간 모니터링</div></div>", unsafe_allow_html=True)
    c4.markdown(f"<div class='kpi-card'><div class='kpi-title'>미처리</div><div class='kpi-value' style='color:#FF453A'>{total-comp-pend}</div><div class='kpi-title'>신속 대응 필요</div></div>", unsafe_allow_html=True)
    
    st.write("##")

    # 2. Charts
    col1, col2 = st.columns(2)
    with col1:
        st.subheader("카테고리별 요청 건수")
        cat_data = db.get_category_stats(start, end)
        if not cat_data.empty:
            fig = px.bar(cat_data, x='count', y='WGUBUN_CDNM', orientation='h', template='plotly_dark', color_discrete_sequence=['#fdf1c8'])
            fig.update_layout(margin=dict(l=0, r=0, t=0, b=0), height=300)
            st.plotly_chart(fig, use_container_width=True, config={'displayModeBar': False})
            
    with col2:
        st.subheader("파트별 요청 건수")
        dept_data = db.get_dept_stats(start, end)
        if not dept_data.empty:
            dept_data['PART_NAME'] = dept_data['PART'].map(lambda x: PART_MAP.get(str(x).zfill(2), "기타"))
            fig = px.bar(dept_data, x='PART_NAME', y='count', color='PART_NAME', template='plotly_dark')
            fig.update_layout(margin=dict(l=0, r=0, t=0, b=0), height=300)
            st.plotly_chart(fig, use_container_width=True, config={'displayModeBar': False})

    # 3. Trends
    st.subheader("월별 처리 현황")
    trend_data = db.get_monthly_trends(start, end)
    if not trend_data.empty:
        fig = px.bar(trend_data, x='month', y='count', color='CNF_YN', barmode='stack', template='plotly_dark', color_discrete_map={'Y': '#6de8a0', 'N': '#e86d6d'})
        st.plotly_chart(fig, use_container_width=True, config={'displayModeBar': False})

    # 4. AI Insights
    st.subheader("🤖 AI 빈번 요청 분석 요약")
    ai1, ai2 = st.columns(2)
    ai_items = [("데이터 처리 오류", "마스터 데이터 정합성 이슈가 다수 발생 중.", "#세금계산서 #데이터"), 
                ("마스터 데이터 관리", "시스템 간 코드 동기화 지연 발생.", "#마스터코드 #동기화"),
                ("출력/리포트 오류", "PDF 리포트 생성 속도 저하 보고됨.", "#리포트 #PDF"), 
                ("시스템 연동 오류", "외부 API 호출 타임아웃 발생.", "#API #연동")]
    
    for i, (title, desc, tags) in enumerate(ai_items):
        col = ai1 if i < 2 else ai2
        col.markdown(f"<div class='ai-card'><b>{title}</b><br>{desc}<br><br>{' '.join([f'<span class=\"tag\">{t}</span>' for t in tags.split()])}</div>", unsafe_allow_html=True)
    
    st.markdown("💡 **AI 개선 권고사항**<br>- 1. 마스터 데이터 자동 검증 로직 구현<br>- 2. 신규 입사자 권한 자동화<br>- 3. FAQ 자동화 시스템 도입", unsafe_allow_html=True)
