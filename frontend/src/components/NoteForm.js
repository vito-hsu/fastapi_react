// src/components/NoteForm.js

import React, { useState, useEffect } from "react";

function NoteForm({ noteToEdit, onSave, onCancel }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null); // 用於儲存新的圖片檔案
  const [clearImage, setClearImage] = useState(false); // 標記是否清除現有圖片

  // 當 noteToEdit 改變時（即開始編輯不同筆記或取消編輯），更新表單狀態
  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content);
      setImage(null); // 編輯時不預設載入檔案，使用者需重新選擇
      setClearImage(false); // 重置清除圖片的狀態
    } else {
      // 如果是新增模式，清空表單
      setTitle("");
      setContent("");
      setImage(null);
      setClearImage(false);
    }
  }, [noteToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);

    // 如果有新圖片被選擇
    if (image) {
      formData.append("image", image);
    }

    // 如果勾選了清除圖片，或者有新圖片上傳時也應該觸發清除舊圖邏輯
    // 後端會判斷 clear_image 優先處理清除，然後再判斷 image 是否存在來處理新圖上傳
    if (clearImage) {
      formData.append("clear_image", "true"); // FormData 傳遞 boolean 通常轉為字串
    } else {
      formData.append("clear_image", "false");
    }

    onSave(formData); // 調用父組件傳入的保存函數
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="title">標題:</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="content">內容:</label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        ></textarea>
      </div>
      <div className="form-group">
        <label htmlFor="image">圖片:</label>
        <input
          type="file"
          id="image"
          accept="image/*" // 只允許選擇圖片檔案
          onChange={(e) => setImage(e.target.files[0])}
        />
      </div>

      {noteToEdit && noteToEdit.image_filename && (
        <div className="form-group">
          <input
            type="checkbox"
            id="clearImage"
            checked={clearImage}
            onChange={(e) => setClearImage(e.target.checked)}
          />
          <label htmlFor="clearImage">清除現有圖片</label>
          <br/>
          <small style={{ color: '#666' }}>
            {image ? "（選擇新圖片將覆蓋舊圖片，勾選此項會先清除舊圖）" : "（清除後將無圖片）"}
          </small>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="button-primary">
          {noteToEdit ? "更新筆記" : "新增筆記"}
        </button>
        <button type="button" className="button-secondary" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}

export default NoteForm;