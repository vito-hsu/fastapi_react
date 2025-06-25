# backend/main.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid

# 建立 FastAPI 應用程式實例
app = FastAPI()

# 設定 CORS 允許跨域請求
# 為了前端應用程式能夠與後端溝通，這是必要的
origins = [
    "http://localhost",
    "http://localhost:3000",  # 前端 React 應用程式的預設位址
    "http://localhost:8080",  # 如果前端也運行在 8080 端口
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # 允許所有 HTTP 方法 (GET, POST, PUT, DELETE 等)
    allow_headers=["*"],  # 允許所有 HTTP 標頭
)

# 筆記的資料模型 (使用 Pydantic 來定義請求和回應的資料結構)
# 新增 category 和 is_important 欄位
class Note(BaseModel):
    id: str
    title: str
    content: str
    category: Optional[str] = None  # 筆記分類
    is_important: bool = False     # 是否重要

# 用於創建新筆記的請求模型 (ID 會自動生成)
class NoteCreate(BaseModel):
    title: str
    content: str
    category: Optional[str] = None
    is_important: bool = False

# 用於更新筆記的請求模型 (所有欄位都是可選的，以便部分更新)
class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    is_important: Optional[bool] = None

# 模擬資料庫：使用 Python 列表來儲存筆記
# 在實際應用中，您會連接到真正的資料庫 (例如 PostgreSQL, MongoDB, 或 Firestore)
notes_db: List[Note] = []

# ===============================================================
# API 端點 (API Endpoints)
# ===============================================================

@app.get("/notes", response_model=List[Note])
async def get_all_notes(
    query: Optional[str] = Query(None, description="搜尋筆記標題或內容的關鍵字"),
    category: Optional[str] = Query(None, description="依分類過濾筆記"),
    sort_by: Optional[str] = Query(None, description="排序依據：'title', 'category', 'is_important'"),
    sort_order: Optional[str] = Query("asc", description="排序順序：'asc' (升序) 或 'desc' (降序)")
):
    """
    取得所有筆記，支援搜尋、分類過濾和排序。
    """
    filtered_notes = notes_db

    # 搜尋功能
    if query:
        filtered_notes = [
            note for note in filtered_notes
            if query.lower() in note.title.lower() or query.lower() in note.content.lower()
        ]

    # 分類過濾功能
    if category:
        filtered_notes = [
            note for note in filtered_notes
            if note.category and note.category.lower() == category.lower()
        ]

    # 排序功能
    if sort_by:
        reverse_sort = (sort_order == "desc")
        if sort_by == "title":
            # 依標題排序 (不區分大小寫)
            filtered_notes.sort(key=lambda note: note.title.lower(), reverse=reverse_sort)
        elif sort_by == "category":
            # 依分類排序，將 None 分類放在最後
            filtered_notes.sort(key=lambda note: (note.category.lower() if note.category else 'zzzzzzzzz'), reverse=reverse_sort)
        elif sort_by == "is_important":
            # 依重要性排序，重要筆記優先 (True 在 False 之前)
            filtered_notes.sort(key=lambda note: note.is_important, reverse=True if sort_order == "desc" else False)
        else:
            raise HTTPException(status_code=400, detail="無效的排序依據。請使用 'title', 'category', 或 'is_important'。")

    return filtered_notes

@app.get("/notes/{note_id}", response_model=Note)
async def get_note_by_id(note_id: str):
    """
    根據 ID 取得單一筆記。
    如果筆記不存在，則返回 404 錯誤。
    """
    for note in notes_db:
        if note.id == note_id:
            return note
    raise HTTPException(status_code=404, detail="筆記未找到")

@app.post("/notes", response_model=Note, status_code=201)
async def create_note(note: NoteCreate):
    """
    創建一個新筆記。
    會自動生成一個唯一的 ID，並包含分類和重要性標記。
    """
    new_note = Note(
        id=str(uuid.uuid4()),
        title=note.title,
        content=note.content,
        category=note.category,
        is_important=note.is_important
    )
    notes_db.append(new_note)
    return new_note

@app.put("/notes/{note_id}", response_model=Note)
async def update_note(note_id: str, note_update: NoteUpdate):
    """
    更新現有筆記。
    根據提供的 ID 更新筆記的標題、內容、分類和重要性標記。
    如果筆記不存在，則返回 404 錯誤。
    """
    for index, note in enumerate(notes_db):
        if note.id == note_id:
            updated_data = note.dict() # 獲取當前筆記的所有數據
            # 檢查並更新每個可選字段
            if note_update.title is not None:
                updated_data["title"] = note_update.title
            if note_update.content is not None:
                updated_data["content"] = note_update.content
            if note_update.category is not None:
                updated_data["category"] = note_update.category
            if note_update.is_important is not None:
                updated_data["is_important"] = note_update.is_important
            
            # 使用更新後的資料創建新的 Note 物件並替換列表中的舊物件
            notes_db[index] = Note(**updated_data)
            return notes_db[index]
    raise HTTPException(status_code=404, detail="筆記未找到")

@app.delete("/notes/{note_id}", status_code=204)
async def delete_note(note_id: str):
    """
    刪除一個筆記。
    根據提供的 ID 刪除筆記。
    如果筆記不存在，則返回 404 錯誤。
    """
    global notes_db  # 聲明使用全域變數
    initial_len = len(notes_db)
    # 從列表中過濾掉要刪除的筆記
    notes_db = [note for note in notes_db if note.id != note_id]
    if len(notes_db) == initial_len:
        raise HTTPException(status_code=404, detail="筆記未找到")
    return {"message": "筆記已成功刪除"}

# 啟動應用程式的指令 (通常從命令行運行，不需要在程式碼中調用)
# uvicorn main:app --reload --port 8080
