import sqlite3
import pandas as pd
import os

# DB 파일 경로 설정
DB_DIR = os.path.join(os.path.dirname(__file__), 'data')
if not os.path.exists(DB_DIR):
    os.makedirs(DB_DIR)

DB_PATH = os.path.join(DB_DIR, 'it_requests.db')
TABLE_NAME = 'it_requests'

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute(f'''
            CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
                NO TEXT PRIMARY KEY,
                WORK_YN TEXT,
                REASON TEXT,
                CATCH_UP TEXT,
                WGUBUN_CD TEXT,
                WGUBUN_CDNM TEXT,
                REQUESTER TEXT,
                REQUEST_DE TEXT,
                CNF_YN TEXT,
                PART TEXT,
                REQUESTER2 TEXT,
                WGUBUN_NM TEXT,
                RESPONSE TEXT,
                LESSRESPONSE TEXT,
                RMK TEXT,
                SLIP_DE TEXT,
                SLIP_NO TEXT,
                UNPY_SLIP TEXT,
                BRAND_CD TEXT,      -- 추가
                DEVELOPER TEXT,     -- 추가
                DEVELOPER2 TEXT,    -- 추가
                RESPONSE_YN TEXT    -- 추가
            )
        ''')
        conn.commit()

def insert_excel_data(df):
    """Excel 데이터를 읽어 DB에 저장 (모든 컬럼 매핑 및 중복 방지)"""

    # 1. 컬럼명 정제
    df.columns = [str(c).strip().upper() for c in df.columns]

    # 2. 한글/영어 통합 매핑 (누락된 4개 컬럼 추가)
    mapping = {
        '번호': 'NO', '작업상태': 'WORK_YN', '요청제목': 'WGUBUN_NM', '요청내용': 'REASON',
        '구분코드': 'WGUBUN_CD', '구분명': 'WGUBUN_CDNM', '요청자사번': 'REQUESTER',
        '요청자': 'REQUESTER2', '요청일자': 'REQUEST_DE', '확인여부': 'CNF_YN', '파트': 'PART',
        '검토내용': 'RESPONSE', '미진사유': 'LESSRESPONSE', 'CATCH_UP': 'CATCH_UP',
        '비고': 'RMK', '전표일자': 'SLIP_DE', '전표번호': 'SLIP_NO', '상계전표': 'UNPY_SLIP',
        '브랜드코드': 'BRAND_CD', '개발자': 'DEVELOPER', '개발자2': 'DEVELOPER2', '검토여부': 'RESPONSE_YN'
    }

    df = df.rename(columns=mapping)

    # 3. 빈 행(NO가 없는 행) 제거 및 타입 정리
    if 'NO' in df.columns:
        df = df.dropna(subset=['NO'])
        df = df[df['NO'].astype(str).str.strip() != '']

    # 4. DB 스키마에 정의된 모든 컬럼 추출
    db_columns = [
        'NO', 'WORK_YN', 'REASON', 'CATCH_UP', 'WGUBUN_CD', 'WGUBUN_CDNM',
        'REQUESTER', 'REQUEST_DE', 'CNF_YN', 'PART', 'REQUESTER2', 'WGUBUN_NM',
        'RESPONSE', 'LESSRESPONSE', 'RMK', 'SLIP_DE', 'SLIP_NO', 'UNPY_SLIP',
        'BRAND_CD', 'DEVELOPER', 'DEVELOPER2', 'RESPONSE_YN'
    ]

    final_cols = [c for c in db_columns if c in df.columns]
    final_df = df[final_cols].copy().fillna('').astype(str)

    # 4. 데이터 청소 및 날짜 형식 보정
    final_df = df[final_cols].copy().fillna('').astype(str)

    if 'REQUEST_DE' in final_df.columns:
        def fix_date(date_str):
            date_str = date_str.strip().split(' ')[0] # 시간 정보 있으면 제거
            if len(date_str) == 8 and date_str.isdigit(): # 20260428 형태인 경우
                return f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
            return date_str

        final_df['REQUEST_DE'] = final_df['REQUEST_DE'].apply(fix_date)

    # 5. DB 저장 (INSERT OR REPLACE 적용으로 중복 에러 차단)
    if not final_df.empty:
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                cols_str = ", ".join(final_df.columns)
                placeholders = ", ".join(["?"] * len(final_df.columns))
                sql = f"INSERT OR REPLACE INTO {TABLE_NAME} ({cols_str}) VALUES ({placeholders})"

                cursor.executemany(sql, [tuple(x) for x in final_df.values])
                conn.commit()
                print(f"✅ [SUCCESS] {len(final_df)}건의 데이터가 처리되었습니다.")
        except Exception as e:
            print(f"❌ [DB ERROR] 저장 실패: {e}")
            raise e

def get_all_requests():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {TABLE_NAME} ORDER BY REQUEST_DE DESC, NO DESC")
        return [dict(row) for row in cursor.fetchall()]

def update_request(no, catch_up):
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute(f"UPDATE {TABLE_NAME} SET CATCH_UP = ? WHERE NO = ?", (catch_up, no))
        conn.commit()

def get_stats(start_date, end_date):
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        query = f"SELECT COUNT(*), SUM(CASE WHEN CNF_YN = 'Y' THEN 1 ELSE 0 END) FROM {TABLE_NAME} WHERE REQUEST_DE BETWEEN ? AND ?"
        cursor.execute(query, (start_date, end_date))
        total, completed = cursor.fetchone()
        total = total or 0
        completed = completed or 0
        return total, completed, total - completed

def get_category_stats(start_date, end_date):
    with sqlite3.connect(DB_PATH) as conn:
        query = f"SELECT WGUBUN_CDNM as name, COUNT(*) as value FROM {TABLE_NAME} WHERE REQUEST_DE BETWEEN ? AND ? GROUP BY WGUBUN_CDNM"
        return pd.read_sql_query(query, conn, params=(start_date, end_date))

def get_dept_stats(start_date, end_date):
    with sqlite3.connect(DB_PATH) as conn:
        query = f"SELECT PART as name, COUNT(*) as value FROM {TABLE_NAME} WHERE REQUEST_DE BETWEEN ? AND ? GROUP BY PART"
        return pd.read_sql_query(query, conn, params=(start_date, end_date))

def get_monthly_trends(start_date, end_date):
    with sqlite3.connect(DB_PATH) as conn:
        year = start_date[:4] if start_date else ""

        query = f"""
            SELECT 
                CASE WHEN REQUEST_DE LIKE '%-%' THEN SUBSTR(REQUEST_DE, 6, 2) ELSE SUBSTR(REQUEST_DE, 5, 2) END as month,
                CNF_YN, COUNT(*) as count
            FROM {TABLE_NAME} 
            WHERE REQUEST_DE LIKE ? 
            GROUP BY month, CNF_YN
        """
        return pd.read_sql_query(query, conn, params=(f"{year}%",))

def get_similar_requests(reason):
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        query = f"SELECT * FROM {TABLE_NAME} WHERE (REASON LIKE ? OR WGUBUN_NM LIKE ?) AND NVL(CATCH_UP, '####') != '' ORDER BY NO DESC LIMIT 6"
        search = f"%{reason[:20]}%"
        cursor.execute(query, (search, search))
        return [dict(row) for row in cursor.fetchall()]