import streamlit as st
import database as db

# Part Mapping
PART_MAP = {
    "01": "생산기획", "02": "영업물류", "03": "인사", "04": "회계",
    "05": "팀장", "06": "기타", "07": "개발"
}

def show_guide(start, end):
    # CSS for high-contrast card components
    st.markdown("""
        <style>
        .badge { padding: 3px 8px; border-radius: 5px; font-weight: bold; font-size: 0.75em; color: white; display: inline-block; }
        .done { background-color: #06402b; }
        .pending { background-color: #401010; }
        </style>
    """, unsafe_allow_html=True)

    data = db.get_all_data(start, end)
    if data.empty:
        st.warning("데이터가 없습니다.")
        return

    cols = st.columns(3)
    for i, (_, row) in enumerate(data.iterrows()):
        part_name = PART_MAP.get(str(row.get('PART', '')).zfill(2), "기타")
        status_txt = "✅ 처리완료" if row.get('CNF_YN') == 'Y' else "🔴 미처리"
        status_cls = "done" if row.get('CNF_YN') == 'Y' else "pending"

        with cols[i % 3]:
            with st.container(border=True):
                # Header: ID & Badge (Badge aligned to far right)
                h1, h2 = st.columns([1, 1])
                h1.caption(f"ID: {row.get('NO', '')}")
                h2.markdown(f"<div style='text-align: right;'><span class='badge {status_cls}'>{status_txt}</span></div>", unsafe_allow_html=True)

                # Title & Body
                st.markdown(f"**{row.get('WGUBUN_NM', '제목없음')}**")
                st.markdown(f"<div style='height:80px; overflow:hidden; font-size:0.9em; color:#E0E0E0;'><b>요청:</b> {row.get('REASON', '')}</div>", unsafe_allow_html=True)

                # Catch-up (if done)
                if row.get('CNF_YN') == 'Y':
                    st.markdown(f"<div style='font-size:0.8em; color:#32D74B;'>처리: {str(row.get('CATCH_UP', ''))[:40]}...</div>", unsafe_allow_html=True)

                st.divider()

                # Footer
                st.caption(f"파트: {part_name} | {row.get('WGUBUN_CDNM', 'N/A')}")
                st.caption(f"👤 {row.get('REQUESTER2', 'N/A')} 📅 {row.get('REQUEST_DE', '')}")

                # Detail Button
                if st.button("상세보기", key=f"btn_{i}", use_container_width=True):
                    st.session_state.detail_data = row
                    st.rerun()

    # 상세보기 팝업 로직
    if 'detail_data' in st.session_state:
        _show_dialog(st.session_state.detail_data)

# --- 누락되었던 팝업 함수 정의 (이 부분 전체를 교체하세요) ---
@st.dialog(" ", width="large")
def _show_dialog(r):
    # 데이터 매핑 및 상태 처리
    part_name = PART_MAP.get(str(r.get('PART', '')).zfill(2), "기타")
    status_txt = "처리완료" if r.get('CNF_YN') == 'Y' else "미처리"
    status_cls = "done" if r.get('CNF_YN') == 'Y' else "pending"

    # 팝업 전용 고급 CSS (이미지 스타일 재현)
    st.markdown("""
        <style>
        .dlg-badge { padding: 4px 10px; border-radius: 15px; font-size: 0.8em; font-weight: bold; }
        .dlg-done { background-color: #0d3d20; color: #4ade80; border: 1px solid #166534; }
        .dlg-pending { background-color: #451a1a; color: #f87171; border: 1px solid #7f1d1d; }
        .meta-box { background-color: #1E2028; padding: 15px; border-radius: 10px; margin-bottom: 10px; border: 1px solid #2D2F39;}
        .meta-title { color: #808495; font-size: 0.85em; margin-bottom: 5px; }
        .meta-val { color: #FFFFFF; font-size: 1.05em; font-weight: 500; }
        .content-title { font-size: 0.95em; margin-bottom: 8px; margin-top: 15px;}
        </style>
    """, unsafe_allow_html=True)

    # 1. 헤더 영역 (ID, 배지, 제목)
    st.markdown(f"""
        <div style="margin-bottom: 20px;">
            <span style="color:#808495; font-size:0.9em; margin-right:10px;">{r.get('NO')}</span>
            <span class="dlg-badge dlg-{status_cls}">{status_txt}</span>
            <h2 style="margin-top:10px; color:white;">{r.get('WGUBUN_NM', '제목 없음')}</h2>
        </div>
    """, unsafe_allow_html=True)

    # 2. 메타데이터 그리드 영역 (2x3 배열)
    c1, c2, c3 = st.columns(3)
    with c1:
        st.markdown(f"<div class='meta-box'><div class='meta-title'>🏢 파트</div><div class='meta-val'>{part_name}</div></div>", unsafe_allow_html=True)
    with c2:
        st.markdown(f"<div class='meta-box'><div class='meta-title'>👤 요청자</div><div class='meta-val'>{r.get('REQUESTER2', '-')}</div></div>", unsafe_allow_html=True)
    with c3:
        st.markdown(f"<div class='meta-box'><div class='meta-title'>👨‍💻 담당자</div><div class='meta-val'>이준혁</div></div>", unsafe_allow_html=True)

    c4, c5, c6 = st.columns(3)
    with c4:
        st.markdown(f"<div class='meta-box'><div class='meta-title'>🏷️ 카테고리</div><div class='meta-val'>{r.get('WGUBUN_CDNM', '-')}</div></div>", unsafe_allow_html=True)
    with c5:
        st.markdown(f"<div class='meta-box'><div class='meta-title'>📅 요청일시</div><div class='meta-val'>{r.get('REQUEST_DE', '-')}</div></div>", unsafe_allow_html=True)
    with c6:
        process_date = r.get('REQUEST_DE', '-') if r.get('CNF_YN') == 'Y' else "대기 중"
        st.markdown(f"<div class='meta-box'><div class='meta-title'>🕒 처리일시</div><div class='meta-val'>{process_date}</div></div>", unsafe_allow_html=True)

    # 3. 본문 내용 영역 (안전한 st.container 사용)
    st.markdown("<div class='content-title' style='color:#E0E0E0;'>📄 <b>요청 내용</b></div>", unsafe_allow_html=True)
    with st.container(border=True):
        st.write(r.get('REASON', '내용 없음'))

    st.markdown("<div class='content-title' style='color:#32D74B;'>✅ <b>처리 내용</b></div>", unsafe_allow_html=True)
    with st.container(border=True):
        if r.get('CNF_YN') == 'Y':
            st.write(r.get('CATCH_UP', '처리 내용이 없습니다.'))
        else:
            st.write("아직 처리되지 않은 요청입니다.")

    # 4. 액션 영역 (미처리 건일 경우 입력 폼 표시)
    if r.get('CNF_YN') == 'N':
        st.divider()
        val = st.text_area("🔧 조치 결과 입력", value=r.get('CATCH_UP', ''), placeholder="처리 내용을 입력해주세요.")
        if st.button("저장 및 처리완료", type="primary", use_container_width=True):
            db.update_request(r.get('NO'), val)
            if 'detail_data' in st.session_state:
                del st.session_state.detail_data
            st.rerun()