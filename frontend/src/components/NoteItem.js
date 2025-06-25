// src/components/NoteItem.js

import React from "react";
import { getImageUrl } from "../api"; // 引入獲取圖片 URL 的函數

function NoteItem({ note, onEdit, onDelete }) {
  // 格式化日期時間
  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString(); // 根據使用者本地設定格式化
  };

  return (
    <div className="note-item">
      <div>
        <h3>{note.title}</h3>
        <p>{note.content}</p>
        {note.image_filename && (
          <img
            src={getImageUrl(note.image_filename)}
            alt={note.title}
            onError={(e) => {
              e.target.onerror = null; // 防止無限循環
              e.target.src = "placeholder-image.png"; // 如果圖片載入失敗，顯示替代圖片
              e.target.alt = "圖片載入失敗";
            }}
          />
        )}
      </div>
      <div className="note-item-meta">
        <p>創建時間: {formatDateTime(note.created_at)}</p>
        <p>更新時間: {formatDateTime(note.updated_at)}</p>
      </div>
      <div className="note-item-actions">
        <button className="button-secondary" onClick={() => onEdit(note)}>
          編輯
        </button>
        <button className="button-danger" onClick={() => onDelete(note.id)}>
          刪除
        </button>
      </div>
    </div>
  );
}

export default NoteItem;