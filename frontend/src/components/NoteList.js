// frontend/src/NoteList.js
import React from 'react';
import NoteItem from './NoteItem';

function NoteList({ notes, onDelete, onEdit, onToggleImportance }) {
  if (notes.length === 0) {
    return (
      <p className="text-center text-gray-500 text-xl py-12 bg-white rounded-xl shadow-inner border border-blue-100 animate-fadeIn font-medium">
        目前沒有筆記。趕快新增一個吧！
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"> {/* 增加sm斷點 */}
      {notes.map(note => (
        <NoteItem
          key={note.id}
          note={note}
          onDelete={onDelete}
          onEdit={onEdit}
          onToggleImportance={onToggleImportance} // 傳遞處理函數
        />
      ))}
    </div>
  );
}

export default NoteList;
