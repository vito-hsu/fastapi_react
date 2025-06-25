// frontend/src/NoteForm.js
import React, { useState, useEffect } from 'react';

function NoteForm({ onSave, editingNote, onCancelEdit }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(''); // 新增分類狀態
  const [isImportant, setIsImportant] = useState(false); // 新增重要性狀態

  // 當 editingNote 改變時，更新表單內容
  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setContent(editingNote.content);
      setCategory(editingNote.category || ''); // 設置分類，如果為 null 則為空字串
      setIsImportant(editingNote.is_important || false); // 設置重要性
    } else {
      // 如果沒有 editingNote，則清空表單
      setTitle('');
      setContent('');
      setCategory('');
      setIsImportant(false);
    }
  }, [editingNote]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('標題和內容都不能為空！');
      return;
    }
    // 傳遞所有筆記資料，包含新的分類和重要性
    onSave({ title, content, category, is_important: isImportant });
    // 儲存後清空表單
    setTitle('');
    setContent('');
    setCategory('');
    setIsImportant(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-blue-100 transform transition-all duration-300 hover:shadow-xl">
      <h2 className="text-3xl font-bold text-gray-700 mb-6 flex items-center">
        <i className="fas fa-pencil-alt mr-3 text-blue-600"></i>
        {editingNote ? '編輯筆記' : '新增筆記'}
      </h2>
      <div className="mb-5">
        <label htmlFor="title" className="block text-gray-700 text-sm font-semibold mb-2">標題:</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 rounded-lg border-2 border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200 shadow-sm placeholder-gray-400"
          placeholder="輸入筆記標題"
          required
        />
      </div>
      <div className="mb-5">
        <label htmlFor="content" className="block text-gray-700 text-sm font-semibold mb-2">內容:</label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="6"
          className="w-full p-3 rounded-lg border-2 border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y transition duration-200 shadow-sm placeholder-gray-400"
          placeholder="輸入筆記內容"
          required
        ></textarea>
      </div>
      <div className="mb-5">
        <label htmlFor="category" className="block text-gray-700 text-sm font-semibold mb-2">分類:</label>
        <input
          type="text"
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-3 rounded-lg border-2 border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition duration-200 shadow-sm placeholder-gray-400"
          placeholder="輸入筆記分類 (例如: 工作, 個人, 學習)"
        />
      </div>
      <div className="mb-6 flex items-center">
        <input
          type="checkbox"
          id="isImportant"
          checked={isImportant}
          onChange={(e) => setIsImportant(e.target.checked)}
          className="mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-md cursor-pointer checked:bg-blue-600 checked:border-transparent transition duration-200"
        />
        <label htmlFor="isImportant" className="text-gray-700 text-base font-semibold cursor-pointer">標記為重要</label>
      </div>

      <div className="flex items-center justify-end space-x-4">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transform hover:scale-105 transition duration-300 ease-in-out flex items-center"
        >
          <i className="fas fa-save mr-2"></i>
          {editingNote ? '更新筆記' : '新增筆記'}
        </button>
        {editingNote && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transform hover:scale-105 transition duration-300 ease-in-out flex items-center"
          >
            <i className="fas fa-times-circle mr-2"></i>
            取消編輯
          </button>
        )}
      </div>
    </form>
  );
}

export default NoteForm;
