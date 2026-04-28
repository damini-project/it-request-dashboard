# ai_logic.py
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

def suggest_sql(reason):
    prompt = f"다음 IT 요청사항에 대한 해결 SQL 또는 가이드를 작성해주세요: {reason}"
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text
    except Exception as e:
        return f"AI 서비스 오류: {e}"
