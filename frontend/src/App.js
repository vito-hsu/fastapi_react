// src/App.js

import React, { useState, useEffect, useCallback } from "react";
import NoteList from "./components/NoteList";
import NoteForm from "./components/NoteForm";
import { getNotes, createNote, updateNote, deleteNote } from "./api";
import "./App.css";

function App() {
  const [notes, setNotes] = useState([]); // 儲存所有筆記
  const [editingNote, setEditingNote] = useState(null); // 儲存正在編輯的筆記 (null 表示不在編輯)
  const [showForm, setShowForm] = useState(false); // 控制表單的顯示/隱藏

  // 獲取所有筆記的函數
  const fetchNotes = useCallback(async () => {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      alert("載入筆記失敗，請檢查後端是否運行。");
    }
  }, []);

  // 組件載入時自動獲取筆記
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // 處理保存筆記 (新建或更新)
  const handleSaveNote = async (formData) => {
    try {
      if (editingNote) {
        // 更新現有筆記
        await updateNote(editingNote.id, formData);
        setEditingNote(null); // 清除編輯狀態
      } else {
        // 創建新筆記
        await createNote(formData);
      }
      setShowForm(false); // 隱藏表單
      fetchNotes(); // 重新載入筆記列表
    } catch (error) {
      console.error("Failed to save note:", error);
      alert(`保存筆記失敗: ${error.message}`);
    }
  };

  // 處理編輯筆記
  const handleEditNote = (note) => {
    setEditingNote(note); // 設定正在編輯的筆記
    setShowForm(true); // 顯示表單
  };

  // 處理刪除筆記
  const handleDeleteNote = async (id) => {
    if (window.confirm("確定要刪除這條筆記嗎？")) {
      try {
        await deleteNote(id);
        fetchNotes(); // 重新載入筆記列表
      } catch (error) {
        console.error("Failed to delete note:", error);
        alert("刪除筆記失敗。");
      }
    }
  };

  // 處理取消編輯或取消新建
  const handleCancelForm = () => {
    setEditingNote(null); // 清除編輯狀態
    setShowForm(false); // 隱藏表單
  };

  return (
    <div className="App">
      <h1>我的筆記</h1>

      {/* 顯示創建/編輯筆記的按鈕或表單 */}
      {!showForm && (
        <button className="button-primary" onClick={() => setShowForm(true)}>
          新增筆記
        </button>
      )}

      {showForm && (
        <div className="form-container">
          <h2>{editingNote ? "編輯筆記" : "新增筆記"}</h2>
          <NoteForm
            noteToEdit={editingNote}
            onSave={handleSaveNote}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {/* 筆記列表 */}
      <NoteList
        notes={notes}
        onEditNote={handleEditNote}
        onDeleteNote={handleDeleteNote}
      />
    </div>
  );
}

export default App;