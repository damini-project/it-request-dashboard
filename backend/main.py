from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import database as db

app = FastAPI()
...
@app.get("/api/requests")
def get_requests():
    return db.get_all_requests()

@app.post("/api/upload-excel")
async def upload_excel(file: UploadFile = File(...)):
    df = pd.read_excel(file.file)
    db.insert_excel_data(df)
    return {"message": "Successfully uploaded and saved data"}



# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CatchupUpdate(BaseModel):
    catch_up: str

@app.on_event("startup")
def startup_event():
    db.init_db()

@app.get("/api/stats")
def get_stats(start_date: str, end_date: str):
    total, completed, pending = db.get_stats(start_date, end_date)
    category_stats = db.get_category_stats(start_date, end_date).to_dict(orient="records")
    dept_stats = db.get_dept_stats(start_date, end_date).to_dict(orient="records")
    
    return {
        "total": total,
        "completed": completed,
        "pending": pending,
        "category_stats": category_stats,
        "dept_stats": dept_stats
    }

@app.get("/api/dashboard-charts")
def get_dashboard_charts(start_date: str, end_date: str):
    # Prepare monthly trends
    monthly_df = db.get_monthly_trends(start_date, end_date)
    
    # Process monthly data into the required format
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

@app.post("/api/requests/{no}/catchup")
def update_catchup(no: str, update: CatchupUpdate):
    db.update_request(no, update.catch_up)
    return {"message": "Success"}
