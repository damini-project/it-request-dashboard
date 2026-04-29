import os
import io
import pandas as pd
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from google import genai
import database as db

# 환경 변수 로드 (.env 파일의 GEMINI_API_KEY 읽기)
load_dotenv()

app = FastAPI()

# --- [CORS Middleware 설정] ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- [AI 분석용 데이터 모델] ---
class RequestItem(BaseModel):
    NO: str
    REASON: str
    RESPONSE: Optional[str] = ""
    CATCH_UP: Optional[str] = ""
    RMK: Optional[str] = ""
    LESS_RESPONSE: Optional[str] = ""

class AnalysisRequest(BaseModel):
    requests: List[RequestItem]

class CatchupUpdate(BaseModel):
    catch_up: str

class AssignRequest(BaseModel):
    part: str
    developer: str
    task_detail: str = ""

# Gemini 클라이언트 초기화 (2026년형 SDK 문법)
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# --- [시스템 시작 설정] ---
@app.on_event("startup")
def startup_event():
    db.init_db()

# --- [1. 기본 데이터 처리 API] ---

@app.get("/api/requests")
def get_requests():
    """전체 요청 목록 조회"""
    return db.get_all_requests()

@app.post("/api/upload-excel")
async def upload_excel(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        file_stream = io.BytesIO(contents)

        # 파일 확장자 확인 및 처리
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file_stream)
        elif file.filename.endswith('.xlsx'):
            df = pd.read_excel(file_stream, engine='openpyxl')
        elif file.filename.endswith('.xls'):
            try:
                # 1단계: xlrd 시도
                df = pd.read_excel(file_stream, engine='xlrd')
            except Exception:
                # 2단계: 실패 시 HTML로 파싱 시도
                file_stream.seek(0)
                dfs = pd.read_html(file_stream)
                if dfs:
                    df = dfs[0]
                else:
                    raise ValueError("파일을 읽을 수 없습니다.")
        else:
            raise HTTPException(status_code=400, detail="지원하지 않는 파일 형식입니다.")

        db.insert_excel_data(df)
        return {"message": "Successfully uploaded and saved data"}
    except Exception as e:
        print(f"업로드 에러: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/requests/{no}/catchup")
def update_catchup(no: str, update: CatchupUpdate):
    """특정 요청의 조치내역(Catch-up) 업데이트"""
    db.update_request(no, update.catch_up)
    return {"message": "Success"}

# --- [2. 대시보드 통계 및 차트 API] ---

@app.get("/api/stats")
def get_stats(start_date: str, end_date: str):
    """대시보드 상단 메트릭 데이터"""
    total, completed, pending = db.get_stats(start_date, end_date)
    # 프론트엔드 Dashboard.jsx의 데이터 구조에 맞춰 반환
    return {
        "total": total,
        "completed": completed,
        "in_progress": 0, # 필요 시 DB 로직 확장 가능
        "pending": pending
    }

@app.get("/api/dashboard-charts")
def get_dashboard_charts(start_date: str, end_date: str):
    """대시보드 차트용 통합 데이터"""
    # 월별 추세 준비
    monthly_df = db.get_monthly_trends(start_date, end_date)
    months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]
    monthly_trend = []

    for m in months:
        m_data = monthly_df[monthly_df['month'] == m]
        done = m_data[m_data['CNF_YN'] == 'Y']['count'].sum()
        pending = m_data[m_data['CNF_YN'] == 'N']['count'].sum()
        monthly_trend.append({
            "month": f"{int(m)}월",
            "done": int(done),
            "pending": int(pending)
        })

    return {
        "category_stats": db.get_category_stats(start_date, end_date).to_dict(orient="records"),
        "dept_stats": db.get_dept_stats(start_date, end_date).to_dict(orient="records"),
        "monthly_trend": monthly_trend
    }

@app.put("/api/requests/{no}/assign")
async def assign_request(no: str, data: AssignRequest):
    try:
        db.update_assignment(no, data.part, data.developer, data.task_detail)
        return {"message": "Assignment updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- [3. AI 분석 및 유사 내역 API] ---

@app.get("/api/similar")
def get_similar(reason: str):
    """과거 유사 요청 건 조회 (WORK_YN 기반)"""
    # database.py에 get_similar_requests 함수가 구현되어 있어야 함
    return db.get_similar_requests(reason)

@app.post("/api/ai-analyze")
async def analyze_requests(data: AnalysisRequest):
    """Gemini AI를 이용한 유사 건 조치 방안 분석"""
    if not data.requests:
        return {"analysis": "유사한 과거 내역이 없어 분석이 어렵습니다."}

    # AI에게 전달할 과거 사례 텍스트 구성
    context = ""
    for r in data.requests:
        if r.CATCH_UP or r.RESPONSE or r.RMK:
            context += f"- 요청: {r.REASON}\n"
            if r.RESPONSE: context += f"  검토내용: {r.RESPONSE}\n"
            if r.CATCH_UP: context += f"  조치내역: {r.CATCH_UP}\n"
            if r.RMK: context += f"  비고: {r.RMK}\n"
            context += "\n"

    prompt = f"""
    당신은 IT 지원 센터의 전문 분석가입니다. 아래의 과거 유사 요청 사례와 그 조치 결과들을 분석하십시오.
    이 데이터들을 기반으로, 새로운 유사 요청이 들어왔을 때 담당자가 어떻게 대응하면 좋을지 
    '조치 방안 가이드'를 한국어로 3~4줄 요약해서 작성해 주세요.

    [과거 사례 데이터]
    {context}
    """

    try:
        # 최신 SDK 모델 호출 (gemini-2.0-flash)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return {"analysis": response.text}
    except Exception as e:
        print(f"AI 분석 오류: {e}")
        return {"analysis": "AI 분석 서비스와 일시적으로 연결할 수 없습니다. 과거 내역을 직접 참고해 주세요."}