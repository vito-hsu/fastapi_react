# backend/main.py
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field # 引入 Field 以便設定預設值
from typing import List, Optional
import uuid
from datetime import datetime # 引入 datetime 模組

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
# 新增 category, is_important, is_archived, created_at, updated_at 欄位
class Note(BaseModel):
    id: str
    title: str
    content: str
    category: Optional[str] = None  # 筆記分類
    is_important: bool = False      # 是否重要
    is_archived: bool = False       # 是否已歸檔 (新增)
    created_at: datetime = Field(default_factory=datetime.now) # 創建時間 (新增)
    updated_at: datetime = Field(default_factory=datetime.now) # 最後更新時間 (新增)

# 用於創建新筆記的請求模型 (ID 和時間戳會自動生成)
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
    is_archived: Optional[bool] = None # 允許更新歸檔狀態

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
    sort_by: Optional[str] = Query(None, description="排序依據：'title', 'category', 'is_important', 'created_at', 'updated_at'"),
    sort_order: Optional[str] = Query("asc", description="排序順序：'asc' (升序) 或 'desc' (降序)"),
    include_archived: Optional[bool] = Query(False, description="是否包含已歸檔的筆記 (預設為 False)") # 新增查詢參數
):
    """
    取得所有筆記，支援搜尋、分類過濾、排序和歸檔狀態過濾。
    """
    filtered_notes = notes_db

    # 歸檔狀態過濾：如果 include_archived 為 False，則只顯示未歸檔的筆記
    if not include_archived:
        filtered_notes = [note for note in filtered_notes if not note.is_archived]

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
        elif sort_by == "created_at":
            # 依創建時間排序
            filtered_notes.sort(key=lambda note: note.created_at, reverse=reverse_sort)
        elif sort_by == "updated_at":
            # 依更新時間排序
            filtered_notes.sort(key=lambda note: note.updated_at, reverse=reverse_sort)
        else:
            raise HTTPException(status_code=400, detail="無效的排序依據。請使用 'title', 'category', 'is_important', 'created_at', 或 'updated_at'。")

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
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="筆記未找到")

@app.post("/notes", response_model=Note, status_code=status.HTTP_201_CREATED)
async def create_note(note: NoteCreate):
    """
    創建一個新筆記。
    會自動生成一個唯一的 ID，並包含分類、重要性標記、創建時間和更新時間。
    """
    current_time = datetime.now()
    new_note = Note(
        id=str(uuid.uuid4()),
        title=note.title,
        content=note.content,
        category=note.category,
        is_important=note.is_important,
        is_archived=False, # 新筆記預設為未歸檔
        created_at=current_time, # 設定創建時間
        updated_at=current_time  # 設定更新時間
    )
    notes_db.append(new_note)
    return new_note

@app.put("/notes/{note_id}", response_model=Note)
async def update_note(note_id: str, note_update: NoteUpdate):
    """
    更新現有筆記。
    根據提供的 ID 更新筆記的標題、內容、分類、重要性標記和歸檔狀態。
    如果筆記不存在，則返回 404 錯誤。
    """
    for index, note in enumerate(notes_db):
        if note.id == note_id:
            # 使用 .model_dump() 獲取當前筆記的所有數據，包括新增的欄位
            updated_data = note.model_dump()
            
            # 使用 .model_dump(exclude_unset=True) 僅獲取在 note_update 中設定的字段
            # 這樣可以實現部分更新，只更新提供的字段
            for key, value in note_update.model_dump(exclude_unset=True).items():
                updated_data[key] = value
            
            updated_data["updated_at"] = datetime.now() # 更新時間戳

            # 使用更新後的資料創建新的 Note 物件並替換列表中的舊物件
            notes_db[index] = Note(**updated_data)
            return notes_db[index]
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="筆記未找到")

@app.delete("/notes/{note_id}", status_code=status.HTTP_200_OK) # 將狀態碼改為 200 OK
async def archive_note(note_id: str):
    """
    歸檔一個筆記 (軟刪除)。
    根據提供的 ID 將筆記標記為已歸檔 (is_archived=True)。
    如果筆記不存在，則返回 404 錯誤。
    """
    global notes_db
    for note in notes_db:
        if note.id == note_id:
            if not note.is_archived: # 只有在未歸檔時才進行歸檔操作
                note.is_archived = True
                note.updated_at = datetime.now() # 更新歸檔時間
                return {"message": "筆記已成功歸檔。"}
            else:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="筆記已是歸檔狀態。")
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="筆記未找到")


@app.patch("/notes/{note_id}/unarchive", response_model=Note)
async def unarchive_note(note_id: str):
    """
    解除歸檔一個筆記。
    根據提供的 ID 將筆記的 is_archived 狀態設為 False。
    如果筆記不存在或未歸檔，則返回相應錯誤。
    """
    for index, note in enumerate(notes_db):
        if note.id == note_id:
            if note.is_archived:
                note.is_archived = False
                note.updated_at = datetime.now() # 更新時間
                return note
            else:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="筆記未歸檔。")
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="筆記未找到")

# 啟動應用程式的指令 (通常從命令行運行，不需要在程式碼中調用)
# uvicorn main:app --reload --port 8080
