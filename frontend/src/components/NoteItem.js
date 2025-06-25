// frontend/src/NoteItem.js
import React from 'react';

function NoteItem({ note, onDelete, onEdit, onToggleImportance }) {
  // 處理複製到剪貼簿的功能
  const handleShareClick = async () => {
    try {
      const textToCopy = `標題: ${note.title}\n內容: ${note.content}\n分類: ${note.category || '無分類'}`;
      // 使用 document.execCommand('copy') 因為 navigator.clipboard 在某些 iframe 環境中可能不被允許
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.style.position = "fixed"; // 避免滾動到視窗外
      textArea.style.left = "-9999px"; // 移出可見區域
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('筆記內容已複製到剪貼簿！');
    } catch (err) {
      console.error('複製失敗:', err);
      alert('複製筆記內容失敗，請手動複製。');
    }
  };

  return (
    <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 flex flex-col justify-between h-full transform hover:scale-[1.02] relative group">
      {/* 針對重要筆記添加一個小標籤或邊框 */}
      {note.is_important && (
        <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold py-1 px-3 rounded-tr-xl rounded-bl-lg shadow-md">
          重要
        </div>
      )}
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-2xl font-bold text-gray-800 break-words pr-4 leading-tight">{note.title}</h3>
          {/* 重要性標記 */}
          <button
            onClick={() => onToggleImportance(note)}
            className={`text-3xl transition duration-300 transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded-full p-1 -mt-1 -mr-1
              ${note.is_important ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-300 hover:text-yellow-400'}`}
            title={note.is_important ? "取消重要標記" : "標記為重要"}
          >
            <i className={note.is_important ? "fas fa-star" : "far fa-star"}></i>
          </button>
        </div>
        {note.category && (
          <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full mb-3 shadow-sm transition duration-200 hover:bg-blue-200">
            <i className="fas fa-tag mr-1"></i> {note.category}
          </span>
        )}
        <p className="text-gray-700 text-base leading-relaxed mb-4 whitespace-pre-wrap">{note.content}</p>
      </div>
      <div className="flex justify-end flex-wrap gap-3 mt-auto pt-4 border-t border-gray-100">
        <button
          onClick={() => onEdit(note)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75 transform hover:scale-105 transition duration-300 ease-in-out flex items-center text-sm"
        >
          <i className="fas fa-edit mr-2"></i> 編輯
        </button>
        <button
          onClick={handleShareClick}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transform hover:scale-105 transition duration-300 ease-in-out flex items-center text-sm"
        >
          <i className="fas fa-share-alt mr-2"></i> 分享
        </button>
        <button
          onClick={() => onDelete(note.id)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transform hover:scale-105 transition duration-300 ease-in-out flex items-center text-sm"
        >
          <i className="fas fa-trash-alt mr-2"></i> 刪除
        </button>
      </div>
    </div>
  );
}

export default NoteItem;
