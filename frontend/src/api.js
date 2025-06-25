// frontend/src/api.js

// 後端 API 的基礎 URL
const API_BASE_URL = 'http://127.0.0.1:8080'; // 確保這與您的 FastAPI 後端運行位址一致

// 處理 API 回應的通用函數
const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '發生未知錯誤');
    }
    // 對於 DELETE 請求，通常沒有回應內容，直接返回空物件
    if (response.status === 204) {
        return {};
    }
    return response.json();
};

/**
 * 取得所有筆記，支援搜尋、分類和排序。
 * @param {string} [query=''] - 搜尋關鍵字。
 * @param {string} [category=''] - 依分類篩選。
 * @param {string} [sortBy=''] - 排序依據 (title, category, is_important)。
 * @param {string} [sortOrder='asc'] - 排序順序 (asc, desc)。
 * @returns {Promise<Array>} 筆記陣列。
 */
export const getNotes = async (query = '', category = '', sortBy = '', sortOrder = 'asc') => {
    try {
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        if (category) params.append('category', category);
        if (sortBy) params.append('sort_by', sortBy);
        if (sortOrder) params.append('sort_order', sortOrder);

        const url = `${API_BASE_URL}/notes?${params.toString()}`;
        const response = await fetch(url);
        return handleResponse(response);
    } catch (error) {
        console.error("Error fetching notes:", error);
        throw error;
    }
};

/**
 * 創建一個新筆記
 * @param {object} noteData - 包含 title, content, category, is_important 的筆記資料
 * @returns {Promise<object>} 新創建的筆記物件
 */
export const createNote = async (noteData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(noteData),
        });
        return handleResponse(response);
    } catch (error) {
        console.error("Error creating note:", error);
        throw error;
    }
};

/**
 * 更新一個現有筆記
 * @param {string} id - 筆記的 ID
 * @param {object} noteData - 包含要更新的 title, content, category, is_important 的筆記資料
 * @returns {Promise<object>} 更新後的筆記物件
 */
export const updateNote = async (id, noteData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(noteData),
        });
        return handleResponse(response);
    } catch (error) {
            console.error(`Error updating note with ID ${id}:`, error);
        throw error;
    }
};

/**
 * 刪除一個筆記
 * @param {string} id - 筆記的 ID
 * @returns {Promise<object>} 空物件或刪除成功的訊息
 */
export const deleteNote = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
            method: 'DELETE',
        });
        return handleResponse(response);
    } catch (error) {
        console.error(`Error deleting note with ID ${id}:`, error);
        throw error;
    }
};
