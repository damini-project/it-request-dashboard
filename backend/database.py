import sqlite3
import os
import pandas as pd

DB_DIR = "data"
DATABASE_NAME = "it_requests.db"
DB_PATH = os.path.join(DB_DIR, DATABASE_NAME)
TABLE_NAME = "it_requests"

def clean_value(val):
    """문자열 변환 및 .0 제거 (20240101.0 -> 20240101)"""
    if pd.isna(val) or val == "":
        return ""
    # 숫자인 경우 소수점 제거 후 문자열화
    if isinstance(val, (float, int)):
        s = str(int(float(val)))
    else:
        s = str(val).strip()
        if s.endswith(".0"):
            s = s[:-2]
    return s if s.lower() != "nan" else ""

def init_db():
    os.makedirs(DB_DIR, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(f"""
            CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
                NO TEXT PRIMARY KEY, 
                WORK_YN TEXT,
                REASON TEXT, 
                WGUBUN_CD TEXT,
                WGUBUN_CDNM TEXT,
                WGUBUN_NM TEXT,
                REQUESTER TEXT,
                REQUESTER2 TEXT,
                DEVELOPER TEXT,
                DEVELOPER2 TEXT,
                REQUEST_DE TEXT,
                CNF_YN TEXT,
                PART TEXT,
                RESPONSE TEXT,
                LESS_RESPONSE TEXT,
                CATCH_UP TEXT,
                RMK TEXT,
                SLIP_DE TEXT,
                SLIP_NO TEXT,
                UNPY_SLIP TEXT
            )
        """)

def insert_excel_data(df):
    """Excel 데이터를 읽어 DB에 저장 (컬럼 매핑 포함)"""
    mapping = {
        '번호': 'NO', '작업상태':'WORK_YN','요청제목': 'WGUBUN_NM', '요청내용': 'REASON',
        '구분코드': 'WGUBUN_CD', '구분명': 'WGUBUN_CDNM',
        '요청자사번':'REQUESTER', '요청자': 'REQUESTER2', '요청일자': 'REQUEST_DE',
        '확인여부': 'CNF_YN', '파트': 'PART',
        '검토내용': 'RESPONSE', '미진사유': 'LESS_RESPONSE',
        'CATCH_UP':'CATCH_UP','비고':'RMK','전표일자':'SLIP_DE', '전표번호':'SLIP_NO','상계전표':'UNPY_SLIP'
    }


    df = df.rename(columns=mapping)

    columns = ['NO', 'WORK_YN', 'REASON', 'CATCH_UP', 'WGUBUN_CD', 'WGUBUN_CDNM', 'REQUESTER', 'REQUEST_DE', 'CNF_YN', 'PART', 'REQUESTER2', 'WGUBUN_NM', 'RESPONSE', 'LESS_RESPONSE']
    df = df[[c for c in columns if c in df.columns]]

    with sqlite3.connect(DB_PATH) as conn:
        df.to_sql(TABLE_NAME, conn, if_exists='append', index=False)


def get_monthly_trends(start_str, end_str):
    with sqlite3.connect(DB_PATH) as conn:
        s, e = start_str.replace("-", ""), end_str.replace("-", "")
        # REQUEST_DE format YYYYMMDD, extract YYYYMM
        query = f"""
            SELECT substr(REQUEST_DE, 5, 2) as month, CNF_YN, COUNT(*) as count 
            FROM {TABLE_NAME} 
            WHERE REQUEST_DE BETWEEN ? AND ? 
            GROUP BY month, CNF_YN
        """
        return pd.read_sql_query(query, conn, params=(s, e))

def get_dept_stats(start_str, end_str):
    with sqlite3.connect(DB_PATH) as conn:
        s, e = start_str.replace("-", ""), end_str.replace("-", "")
        query = f"SELECT PART, COUNT(*) as count FROM {TABLE_NAME} WHERE REQUEST_DE BETWEEN ? AND ? GROUP BY PART"
        return pd.read_sql_query(query, conn, params=(s, e))

def get_category_stats(start_str, end_str):
    with sqlite3.connect(DB_PATH) as conn:
        s, e = start_str.replace("-", ""), end_str.replace("-", "")
        query = f"SELECT WGUBUN_CDNM, COUNT(*) as count FROM {TABLE_NAME} WHERE REQUEST_DE BETWEEN ? AND ? GROUP BY WGUBUN_CDNM"
        return pd.read_sql_query(query, conn, params=(s, e))

def get_stats(start_str, end_str):
    """start_str, end_str는 '20240401' 형태의 문자열이어야 함"""
    with sqlite3.connect(DB_PATH) as conn:
        s, e = start_str.replace("-", ""), end_str.replace("-", "")
        query = f"SELECT * FROM {TABLE_NAME} WHERE REQUEST_DE BETWEEN ? AND ?"
        df = pd.read_sql_query(query, conn, params=(s, e))
        total = len(df)
        completed = len(df[df['CNF_YN'] == 'Y'])
        pending = len(df[df['CNF_YN'] == 'N'])
        return total, completed, pending

def get_duplicate_patterns():
    with sqlite3.connect(DB_PATH) as conn:
        # 상위 5개 패턴 가져오기
        return pd.read_sql_query(f"""
            SELECT REASON as '요청내용', COUNT(*) as '건수' 
            FROM {TABLE_NAME} 
            GROUP BY REASON 
            ORDER BY 건수 DESC LIMIT 5
        """, conn)

def get_similar_catchup(reason):
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute(f"SELECT CATCH_UP FROM {TABLE_NAME} WHERE REASON LIKE ? AND CATCH_UP != '' ORDER BY ROWID DESC LIMIT 1", (f'%{reason}%',))
        res = cursor.fetchone()
        return res[0] if res else ""

def update_request(no, catch_up):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(f"UPDATE {TABLE_NAME} SET CATCH_UP = ?, CNF_YN = 'Y' WHERE NO = ?", (catch_up, no))

def get_all_requests():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {TABLE_NAME} ORDER BY NO DESC")
        return [dict(row) for row in cursor.fetchall()]