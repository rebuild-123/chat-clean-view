from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import os
import thinking

# ====== 基本設定 ======
FRONTEND_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS", "*").split(",")  # 開發期先用 *，上線請改成你的網域

app = FastAPI(title="Simple Text Echo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in FRONTEND_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====== 資料模型 ======
class MessageIn(BaseModel):
    message: str = Field(..., description="前端傳入的文字")

class MessageOut(BaseModel):
    text: str

# ====== 健康檢查（可選） ======
@app.get("/healthz")
def healthz():
    return {"ok": True}

# ====== 核心 API：接收文字 → 回傳文字 ======
@app.post("/reply", response_model=MessageOut)
def reply(payload: MessageIn):
    msg = (payload.message or "").strip()

    if not msg:
        raise HTTPException(status_code=400, detail="message 不可為空")

    # 這裡寫你的處理邏輯：目前簡單示範「加點前/後綴再回傳」
    # 你也可以在這裡做關鍵字判斷、查表、固定回覆等
    # 範例：關鍵字回覆
    if msg.lower().startswith("hi"):
        reply_text = "Hi! 有什麼需要我幫忙的嗎？"
    elif "時間" in msg:
        from datetime import datetime
        reply_text = f"現在時間：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    else:
        reply_text =  thinking.answering(msg) # f"你剛說：{msg}" +
    # else :
    #     reply_text = f"你剛說：{msg}"


    return MessageOut(text=reply_text)
