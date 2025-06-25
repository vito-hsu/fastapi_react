// src/api.js

// !!! 注意：這裡已將 PORT 修改為 8080 !!!
const API_BASE_URL = "http://localhost:8080"; // 確保這裡與您的 FastAPI 後端地址匹配

/**
 * 獲取所有筆記
 * @returns {Promise<Array>} 筆記列表
 */
export const getNotes = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/notes/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching notes:", error);
    throw error;
  }
};

/**
 * 獲取單個筆記
 * @param {number} id 筆記ID
 * @returns {Promise<Object>} 單個筆記物件
 */
export const getNoteById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Note not found");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching note with ID ${id}:`, error);
    throw error;
  }
};

/**
 * 創建新筆記
 * @param {Object} formData FormData 物件，包含 title, content, image (Optional)
 * @returns {Promise<Object>} 創建成功的筆記物件
 */
export const createNote = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notes/`, {
      method: "POST",
      body: formData, // 直接傳遞 FormData 物件，fetch 會自動設置 Content-Type
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating note:", error);
    throw error;
  }
};

/**
 * 更新筆記
 * @param {number} id 筆記ID
 * @param {Object} formData FormData 物件，包含 title, content, image (Optional), clear_image (Optional)
 * @returns {Promise<Object>} 更新後的筆記物件
 */
export const updateNote = async (id, formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: "PUT",
      body: formData, // 直接傳遞 FormData 物件
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error updating note with ID ${id}:`, error);
    throw error;
  }
};

/**
 * 刪除筆記
 * @param {number} id 筆記ID
 * @returns {Promise<Object>} 刪除成功的訊息
 */
export const deleteNote = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error deleting note with ID ${id}:`, error);
    throw error;
  }
};

// 用於圖片的 URL
export const getImageUrl = (filename) => {
  return `${API_BASE_URL}/images/${filename}`;
};