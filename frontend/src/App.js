// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
// 更新導入路徑，指向 components 資料夾
import NoteList from './components/NoteList';
import NoteForm from './components/NoteForm';
import { getNotes, createNote, updateNote, deleteNote } from './api';

function App() {
  const [notes, setNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // 搜尋關鍵字
  const [selectedCategory, setSelectedCategory] = useState(''); // 選中的分類
  const [sortBy, setSortBy] = useState(''); // 排序依據
  const [sortOrder, setSortOrder] = useState('asc'); // 排序順序

  // 應用程式載入時，從後端取得所有筆記
  useEffect(() => {
    fetchNotes();
  }, [searchTerm, selectedCategory, sortBy, sortOrder]); // 依賴項改變時重新獲取筆記

  // 從後端取得筆記的函數 (包含搜尋、分類和排序參數)
  const fetchNotes = async () => {
    try {
      const data = await getNotes(searchTerm, selectedCategory, sortBy, sortOrder);
      setNotes(data);
    } catch (error) {
      console.error("無法取得筆記:", error);
    }
  };

  // 處理新增或更新筆記的函數
  const handleSaveNote = async (noteData) => {
    try {
      if (editingNote) {
        const updatedNote = await updateNote(editingNote.id, noteData);
        // 替換列表中的舊筆記
        setNotes(notes.map(note => (note.id === updatedNote.id ? updatedNote : note)));
        setEditingNote(null);
      } else {
        const newNote = await createNote(noteData);
        setNotes([...notes, newNote]);
      }
      fetchNotes(); // 儲存後重新獲取並應用篩選/排序，確保顯示最新狀態
    } catch (error) {
      console.error("儲存筆記失敗:", error);
    }
  };

  // 處理刪除筆記的函數
  const handleDeleteNote = async (id) => {
    try {
      await deleteNote(id);
      setNotes(notes.filter(note => note.id !== id));
      if (editingNote && editingNote.id === id) {
        setEditingNote(null);
      }
      fetchNotes(); // 刪除後重新獲取並應用篩選/排序
    } catch (error) {
      console.error("刪除筆記失敗:", error);
    }
  };

  // 處理點擊編輯按鈕的函數
  const handleEditClick = (note) => {
    setEditingNote(note);
  };

  // 處理取消編輯的函數
  const handleCancelEdit = () => {
    setEditingNote(null);
  };

  // 處理重要性標記切換的函數
  const handleToggleImportance = async (note) => {
    try {
      const updatedNote = await updateNote(note.id, { is_important: !note.is_important });
      // 替換列表中的舊筆記
      setNotes(notes.map(n => (n.id === updatedNote.id ? updatedNote : n)));
      fetchNotes(); // 切換後重新獲取並應用篩選/排序
    } catch (error) {
      console.error("切換重要性失敗:", error);
    }
  };

  // 取得所有不重複的分類 (用於篩選下拉選單)
  // 這裡只從當前顯示的筆記中提取分類。如果數據量大，最好從後端獲取獨立的分類列表。
  const allCategories = [...new Set(notes.map(note => note.category).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 font-inter text-gray-800">
      <div className="container mx-auto p-6 bg-white rounded-2xl shadow-xl border border-blue-200">
        <h1 className="text-5xl font-extrabold text-center text-blue-800 mb-10 tracking-tight drop-shadow-lg">我的智慧筆記</h1>

        <NoteForm
          onSave={handleSaveNote}
          editingNote={editingNote}
          onCancelEdit={handleCancelEdit}
        />

        <hr className="my-10 border-t-2 border-blue-200 opacity-60" /> {/* 更柔和的分隔線 */}

        <h2 className="text-3xl font-bold text-gray-700 mb-6 flex items-center">
          <i className="fas fa-list-alt mr-3 text-blue-600"></i> 所有筆記
        </h2>

        {/* 搜尋、篩選和排序控制項 */}
        <div className="mb-8 p-5 bg-blue-50 rounded-xl shadow-inner flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          {/* 搜尋框 */}
          <input
            type="text"
            placeholder="🔍 搜尋標題或內容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow w-full md:w-auto p-3 rounded-lg border-2 border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200 shadow-sm placeholder-gray-400"
          />

          {/* 分類篩選 */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-auto p-3 rounded-lg border-2 border-blue-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none pr-8 transition duration-200 shadow-sm cursor-pointer hover:border-blue-400"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-6 h-6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", backgroundSize: "1.5rem" }}
          >
            <option value="">所有分類</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* 排序依據 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full md:w-auto p-3 rounded-lg border-2 border-blue-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none pr-8 transition duration-200 shadow-sm cursor-pointer hover:border-blue-400"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-6 h-6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", backgroundSize: "1.5rem" }}
          >
            <option value="">排序依據</option>
            <option value="title">標題</option>
            <option value="category">分類</option>
            <option value="is_important">重要性</option>
          </select>

          {/* 排序順序 */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full md:w-auto p-3 rounded-lg border-2 border-blue-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none pr-8 transition duration-200 shadow-sm cursor-pointer hover:border-blue-400"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-6 h-6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", backgroundSize: "1.5rem" }}
          >
            <option value="asc">升序</option>
            <option value="desc">降序</option>
          </select>
        </div>

        <NoteList
          notes={notes}
          onDelete={handleDeleteNote}
          onEdit={handleEditClick}
          onToggleImportance={handleToggleImportance}
        />
      </div>
    </div>
  );
}

export default App;
