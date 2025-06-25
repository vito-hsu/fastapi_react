# 使用 Python 官方提供的輕量級基礎映像
FROM python:3.9-slim-buster

# 設定工作目錄
WORKDIR /app

# 複製依賴文件並安裝
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 複製應用程式程式碼
COPY . .

# 定義環境變數 PORT，Cloud Run 會使用這個變數來指定服務監聽的端口
ENV PORT 8080

# 使用 Gunicorn 運行 FastAPI 應用程式
# uvicorn.workers.UvicornWorker 是 Gunicorn 的一個 worker 類別，用於運行 ASGI 應用程式
# --bind 0.0.0.0:$PORT 表示監聽所有網路接口和指定的端口
CMD exec gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:"$PORT"