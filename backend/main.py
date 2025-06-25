# backend/main.py

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import shutil
import uuid
from PIL import Image, UnidentifiedImageError # 引入 Pillow 相關模組

# 初始化 FastAPI 應用
app = FastAPI()

# --- CORS 設定 ---
# 允許所有來源 (All origins)
# 這在開發階段很方便，但在生產環境中應該限制為您的前端網域
origins = [
    "http://localhost",
    "http://localhost:3000", # 您的 React 應用預設運行在 3000 埠 (前端來源)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # 允許所有 HTTP 方法 (GET, POST, PUT, DELETE 等)
    allow_headers=["*"], # 允許所有請求頭
)

# --- 圖片儲存路徑 ---
UPLOAD_DIRECTORY = "uploads"
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

# --- 數據模型 (Pydantic) ---
# 這是筆記的數據模型
class Note(BaseModel):
    id: int
    title: str
    content: str
    image_filename: Optional[str] = None # 圖片檔名，可選
    created_at: datetime
    updated_at: datetime

# 這是用於創建筆記的請求模型 (ID 和時間戳由後端生成)
class NoteCreate(BaseModel):
    title: str
    content: str

# 這是用於更新筆記的請求模型 (所有字段都是可選的，除了清圖旗標)
class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    # clear_image: Optional[bool] = False # 這個字段將通過 Form 傳遞，不放在 Pydantic 模型中

# 模擬資料庫
# 使用一個簡單的字典來儲存筆記，ID 會自動遞增
notes_db = {}
next_id = 1

# --- API 端點 ---

# 根路徑 (測試用)
@app.get("/")
async def read_root():
    return {"message": "Welcome to the FastAPI Note API!"}

# 獲取所有筆記 (支援分頁)
@app.get("/notes/", response_model=List[Note])
async def read_notes(skip: int = 0, limit: int = 10):
    # 將字典的值轉換為列表，並按 ID 排序，然後應用分頁
    sorted_notes = sorted(notes_db.values(), key=lambda note: note.id, reverse=True) # 通常最新創建的在前面
    return sorted_notes[skip : skip + limit]

# 獲取單個筆記
@app.get("/notes/{note_id}", response_model=Note)
async def read_note(note_id: int):
    if note_id not in notes_db:
        raise HTTPException(status_code=404, detail="Note not found")
    return notes_db[note_id]

# 創建筆記
@app.post("/notes/", response_model=Note)
async def create_note(
    title: str = Form(...),
    content: str = Form(...),
    image: Optional[UploadFile] = File(None)
):
    global next_id
    new_id = next_id
    next_id += 1
    now = datetime.now()
    image_filename = None

    if image:
        try:
            # 檢查檔案是否為圖片
            image_path = os.path.join(UPLOAD_DIRECTORY, image.filename)
            # 將上傳的檔案儲存到磁碟
            with open(image_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            
            # 檢查圖片是否有效
            with Image.open(image_path) as img:
                img.verify() # 驗證圖片檔案

            # 產生一個唯一的檔名，以避免重複
            file_extension = os.path.splitext(image.filename)[1]
            image_filename = f"{uuid.uuid4()}{file_extension}"
            final_image_path = os.path.join(UPLOAD_DIRECTORY, image_filename)
            os.rename(image_path, final_image_path) # 重命名為唯一檔名
            
        except UnidentifiedImageError:
            # 如果不是有效的圖片檔案，刪除已儲存的檔案
            if os.path.exists(image_path):
                os.remove(image_path)
            raise HTTPException(status_code=400, detail="Invalid image file provided.")
        except Exception as e:
            # 處理其他檔案操作錯誤
            if os.path.exists(image_path):
                os.remove(image_path)
            raise HTTPException(status_code=500, detail=f"Could not upload image: {e}")

    note = Note(
        id=new_id,
        title=title,
        content=content,
        image_filename=image_filename,
        created_at=now,
        updated_at=now
    )
    notes_db[new_id] = note
    return note

# 更新筆記
@app.put("/notes/{note_id}", response_model=Note)
async def update_note(
    note_id: int,
    title: Optional[str] = Form(None),
    content: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    clear_image: bool = Form(False) # 用於前端傳遞是否清除圖片的旗標
):
    if note_id not in notes_db:
        raise HTTPException(status_code=404, detail="Note not found")

    existing_note = notes_db[note_id]
    now = datetime.now()
    updated_image_filename = existing_note.image_filename

    # 處理清除圖片的邏輯
    if clear_image:
        if existing_note.image_filename:
            # 刪除舊圖片檔案
            old_image_path = os.path.join(UPLOAD_DIRECTORY, existing_note.image_filename)
            if os.path.exists(old_image_path):
                os.remove(old_image_path)
        updated_image_filename = None # 清除檔名

    # 處理新圖片上傳
    if image:
        # 如果有新圖片上傳，先刪除舊圖片 (如果存在)
        if existing_note.image_filename and not clear_image: # 如果沒有勾選清除，但有舊圖，就刪舊圖
            old_image_path = os.path.join(UPLOAD_DIRECTORY, existing_note.image_filename)
            if os.path.exists(old_image_path):
                os.remove(old_image_path)
        
        try:
            image_path = os.path.join(UPLOAD_DIRECTORY, image.filename)
            with open(image_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            
            with Image.open(image_path) as img:
                img.verify()

            file_extension = os.path.splitext(image.filename)[1]
            updated_image_filename = f"{uuid.uuid4()}{file_extension}"
            final_image_path = os.path.join(UPLOAD_DIRECTORY, updated_image_filename)
            os.rename(image_path, final_image_path)

        except UnidentifiedImageError:
            if os.path.exists(image_path):
                os.remove(image_path)
            raise HTTPException(status_code=400, detail="Invalid image file provided.")
        except Exception as e:
            if os.path.exists(image_path):
                os.remove(image_path)
            raise HTTPException(status_code=500, detail=f"Could not upload image: {e}")

    # 更新筆記內容
    if title is not None:
        existing_note.title = title
    if content is not None:
        existing_note.content = content
    
    existing_note.image_filename = updated_image_filename
    existing_note.updated_at = now

    return existing_note

# 刪除筆記
@app.delete("/notes/{note_id}", response_model=dict)
async def delete_note(note_id: int):
    if note_id not in notes_db:
        raise HTTPException(status_code=404, detail="Note not found")

    note_to_delete = notes_db.pop(note_id)
    # 如果筆記有圖片，同時刪除圖片檔案
    if note_to_delete.image_filename:
        image_path = os.path.join(UPLOAD_DIRECTORY, note_to_delete.image_filename)
        if os.path.exists(image_path):
            os.remove(image_path)
            
    return {"message": f"Note {note_id} deleted successfully."}

# 提供圖片檔案服務
@app.get("/images/{filename}")
async def get_image(filename: str):
    file_path = os.path.join(UPLOAD_DIRECTORY, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    # 返回檔案作為響應
    return FileResponse(file_path)
