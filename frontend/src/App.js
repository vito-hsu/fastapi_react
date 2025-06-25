import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Alert,
  CssBaseline,
  Box,
  CircularProgress // 引入進度條組件
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Add, Edit, Star, ArchiveOutlined, UnarchiveOutlined } from '@mui/icons-material'; // 引入新的圖標

// 引入 Firebase SDK 模組
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics"; // 引入 Analytics
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'; // 移除了 signInWithCustomToken
import {
  getFirestore, collection, query, onSnapshot,
  addDoc, updateDoc, doc, where, orderBy
} from 'firebase/firestore';

// 您的 Firebase 網頁應用程式配置
const firebaseConfig = {
  apiKey: "AIzaSyAJ9A9NYg_4Im0DhPQ8gKw5xgQ6N8lPO6M",
  authDomain: "fastapi-react-vito.firebaseapp.com",
  projectId: "fastapi-react-vito",
  storageBucket: "fastapi-react-vito.firebasestorage.app",
  messagingSenderId: "146836295369",
  appId: "1:146836295369:web:3ed39950a06ae9b2e60718",
  measurementId: "G-5ZTZ3Q2642"
};

// 後端 API 的基本 URL
// *** 請將這裡的 'YOUR_RENDER_BACKEND_SERVICE_URL' 替換為您從 Render 獲得的 FastAPI 後端服務 URL ***
// 例如: 'https://fastapi-notes-backend-xxxx.onrender.com'
const API_BASE_URL = 'YOUR_RENDER_BACKEND_SERVICE_URL';

// 初始化 Firebase 應用程式和服務
// 在組件外部初始化，以避免不必要的重複初始化
let app;
let db;
let auth;
let analytics; // 聲明 analytics 變數
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  analytics = getAnalytics(app); // 初始化 Analytics
} catch (error) {
  console.error("Firebase 初始化失敗:", error);
  // 在這裡可以處理 Firebase 初始化失敗的 UI 提示
}

// 定義 Material-UI 主題
const theme = createTheme({
  palette: {
    primary: { main: '#673ab7' }, // 深紫色，用於主要按鈕、App Bar 等
    secondary: { main: '#009688' }, // 青色，用於次要按鈕或強調色
    background: { default: '#f5f5f5' }, // 淺灰色背景，讓介面更柔和
    text: {
      primary: '#333333', // 深色文字，提高可讀性
      secondary: '#666666', // 淺色文字
    }
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif', // 使用 Roboto 字體，提供備用字體
    h5: { // 應用於較大的標題，如 App Bar
      fontWeight: 700,
      fontSize: '1.75rem',
      letterSpacing: '0.02em',
    },
    h6: { // 用於卡片標題
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.9rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      opacity: 0.8,
    }
  },
  spacing: 8, // 預設間距單位 (8px)
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // 按鈕圓角
          textTransform: 'none', // 禁用大寫轉換
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12, // 卡片圓角
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)', // 柔和的陰影
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out', // 平滑過渡
          '&:hover': {
            transform: 'translateY(-6px)', // 鼠標懸停時卡片輕微上浮
            boxShadow: '0 8px 20px rgba(0,0,0,0.12)', // 更明顯的陰影
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderRadius: 8, // 輸入框圓角
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8, // 選擇框圓角
        }
      }
    }
  }
});

function App() {
  // Firebase 服務實例的狀態
  const [firestoreDb, setFirestoreDb] = useState(null);
  // 雖然是公開筆記，但 Canvas 環境要求進行認證以連接 Firestore
  const [isAuthReady, setIsAuthReady] = useState(false);
  // 認證加載狀態
  const [loadingAuth, setLoadingAuth] = useState(true);

  // 筆記列表的狀態
  const [notes, setNotes] = useState([]);
  // 搜尋關鍵字的狀態
  const [searchTerm, setSearchTerm] = useState('');
  // 分類過濾的狀態
  const [categoryFilter, setCategoryFilter] = useState('');
  // 排序依據的狀態 (e.g., 'title', 'category', 'is_important', 'created_at', 'updated_at')
  const [sortBy, setSortBy] = useState('');
  // 排序順序的狀態 ('asc' 或 'desc')
  const [sortOrder, setSortOrder] = useState('asc');
  // 控制是否顯示已歸檔筆記的狀態
  const [showArchived, setShowArchived] = useState(false);

  // 控制新增/編輯筆記對話框的開啟狀態
  const [showDialog, setShowDialog] = useState(false);
  // 正在編輯的筆記物件，如果為 null 則表示新增
  const [editingNote, setEditingNote] = useState(null);
  // 筆記表單的資料狀態
  const [form, setForm] = useState({ title: '', content: '', category: '', is_important: false, is_archived: false });

  // Snackbar 提示訊息的狀態
  const [message, setMessage] = useState('');
  // 控制 Snackbar 開啟狀態
  const [alertOpen, setAlertOpen] = useState(false);
  // 控制 Alert 類型 (success, error, info, warning)
  const [alertSeverity, setAlertSeverity] = useState('success');

  // 初始化 Firebase 認證和 Firestore
  useEffect(() => {
    if (!app || !db || !auth) {
        console.error("Firebase app, db, or auth 未初始化。");
        setMessage('Firebase 未初始化，請檢查配置。');
        setAlertSeverity('error');
        setAlertOpen(true);
        setLoadingAuth(false);
        return;
    }

    // 監聽認證狀態變化
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (!user) {
            // 如果用戶未登錄，則執行匿名登錄
            try {
                await signInAnonymously(auth);
                setIsAuthReady(true); // 認證成功
            } catch (error) {
                console.error("Firebase 認證錯誤:", error);
                setMessage('認證失敗，請重新整理頁面。');
                setAlertSeverity('error');
                setAlertOpen(true);
            }
        } else {
            setIsAuthReady(true); // 用戶已登錄，認證成功
        }
        setLoadingAuth(false); // 認證完成，停止加載狀態
    });

    // 將 Firebase 服務實例儲存到狀態中
    setFirestoreDb(db);

    // 組件卸載時取消訂閱認證狀態監聽器
    return () => unsubscribeAuth();
  }, []); // 空依賴陣列表示只在組件掛載時運行一次

  // 異步函數：從 Firestore 獲取筆記列表
  // 使用 onSnapshot 實現實時更新
  useEffect(() => {
    // 只有當 Firestore 和認證都準備好時才獲取筆記
    if (!firestoreDb || !isAuthReady) {
      // console.log("Firestore DB 或認證未準備好，無法獲取筆記。");
      return;
    }

    // 構建 Firestore 查詢
    // 集合路徑現在使用硬編碼的 projectId
    let notesCollectionRef = collection(firestoreDb, `artifacts/${firebaseConfig.projectId}/public/data/notes`);
    let q = query(notesCollectionRef);

    // 應用過濾條件
    if (!showArchived) {
      q = query(q, where('is_archived', '==', false));
    }
    if (categoryFilter) {
      q = query(q, where('category', '==', categoryFilter));
    }

    // 應用排序條件 (Firestore 排序限制：對某些字段組合可能需要複合索引)
    // 對於 'created_at' 和 'updated_at' 使用 Firestore 排序
    if (sortBy === 'created_at') {
      q = query(q, orderBy('created_at', sortOrder));
    } else if (sortBy === 'updated_at') {
      q = query(q, orderBy('updated_at', sortOrder));
    } else {
        // 如果沒有指定 Firestore 可排序的字段，或者指定了 'title', 'content', 'category', 'is_important'，
        // 則先按創建時間排序，後續在客戶端進行額外排序和過濾。
        // 這避免了Firestore複合索引的需求，但可能導致更多數據下載。
        q = query(q, orderBy('created_at', 'desc')); // 默認按創建時間降序
    }

    // 訂閱實時更新
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchedNotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // 將 Firestore Timestamp 轉換為 JavaScript Date 對象
        created_at: doc.data().created_at ? doc.data().created_at.toDate() : null,
        updated_at: doc.data().updated_at ? doc.data().updated_at.toDate() : null,
      }));

      // 客戶端過濾搜尋關鍵字（Firestore 不直接支持全文搜尋）
      if (searchTerm) {
          fetchedNotes = fetchedNotes.filter(note =>
              note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              note.content.toLowerCase().includes(searchTerm.toLowerCase())
          );
      }

      // 客戶端排序非時間戳字段，或當 Firestore 排序未完全滿足需求時
      if (sortBy && sortBy !== 'created_at' && sortBy !== 'updated_at') {
          fetchedNotes.sort((a, b) => {
              const valA = (typeof a[sortBy] === 'string' ? a[sortBy].toLowerCase() : a[sortBy]) || '';
              const valB = (typeof b[sortBy] === 'string' ? b[sortBy].toLowerCase() : b[sortBy]) || '';

              if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
              if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
              return 0;
          });
      }


      setNotes(fetchedNotes); // 更新筆記列表狀態
    }, (error) => {
      console.error("從 Firestore 獲取筆記失敗:", error);
      setMessage('無法獲取筆記，請檢查網路連接或 Firestore 權限。');
      setAlertSeverity('error');
      setAlertOpen(true);
    });

    // 組件卸載或依賴項變化時取消訂閱
    return () => unsubscribe();
  }, [firestoreDb, isAuthReady, searchTerm, categoryFilter, sortBy, sortOrder, showArchived]); // 依賴項

  // 處理筆記表單提交 (新增或編輯)
  const handleSubmit = async () => {
    // 確保 Firestore 和認證已準備好
    if (!firestoreDb || !isAuthReady) {
      setMessage('應用程式未準備好，請稍後再試。');
      setAlertSeverity('warning');
      setAlertOpen(true);
      return;
    }

    // 簡單的表單驗證
    if (!form.title.trim()) {
      setMessage('標題不能為空！');
      setAlertSeverity('warning');
      setAlertOpen(true);
      return;
    }
    if (!form.content.trim()) {
      setMessage('內容不能為空！');
      setAlertSeverity('warning');
      setAlertOpen(true);
      return;
    }

    try {
      if (editingNote) {
        // 更新現有筆記
        const noteRef = doc(firestoreDb, `artifacts/${firebaseConfig.projectId}/public/data/notes`, editingNote.id);
        await updateDoc(noteRef, {
          title: form.title,
          content: form.content,
          category: form.category,
          is_important: form.is_important,
          is_archived: form.is_archived, // 允許通過編輯對話框更新歸檔狀態
          updated_at: new Date(), // 手動更新時間戳
        });
        setMessage('筆記已成功更新！');
      } else {
        // 新增筆記
        await addDoc(collection(firestoreDb, `artifacts/${firebaseConfig.projectId}/public/data/notes`), {
          title: form.title,
          content: form.content,
          category: form.category,
          is_important: form.is_important,
          is_archived: false, // 新筆記預設為未歸檔
          created_at: new Date(), // 設定創建時間
          updated_at: new Date(), // 設定更新時間
        });
        setMessage('筆記已成功新增！');
      }
      setShowDialog(false); // 關閉對話框
      setForm({ title: '', content: '', category: '', is_important: false, is_archived: false }); // 重置表單
      setEditingNote(null); // 清除編輯狀態
      setAlertSeverity('success'); // 設定成功提示
      setAlertOpen(true); // 顯示提示
    } catch (err) {
      console.error('提交筆記失敗:', err);
      setMessage(`提交筆記失敗：${err.message || '未知錯誤'}`);
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  // 處理歸檔筆記（軟刪除）
  const handleArchive = async (id) => {
    // 確保 Firestore 和認證已準備好
    if (!firestoreDb || !isAuthReady) {
      setMessage('應用程式未準備好，請稍後再試。');
      setAlertSeverity('warning');
      setAlertOpen(true);
      return;
    }
    if (!window.confirm('確定要歸檔這條筆記嗎？它將不再顯示在主要列表中，但可以從歸檔區恢復。')) {
      return;
    }

    try {
      const noteRef = doc(firestoreDb, `artifacts/${firebaseConfig.projectId}/public/data/notes`, id);
      await updateDoc(noteRef, { is_archived: true, updated_at: new Date() }); // 將 is_archived 設為 true
      setMessage('筆記已成功歸檔！');
      setAlertSeverity('success');
      setAlertOpen(true);
    } catch (err) {
      console.error('歸檔筆記失敗:', err);
      setMessage(`歸檔筆記失敗：${err.message || '未知錯誤'}`);
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  // 處理解除歸檔筆記
  const handleUnarchive = async (id) => {
    // 確保 Firestore 和認證已準備好
    if (!firestoreDb || !isAuthReady) {
      setMessage('應用程式未準備好，請稍後再試。。');
      setAlertSeverity('warning');
      setAlertOpen(true);
      return;
    }
    if (!window.confirm('確定要解除歸檔這條筆記嗎？它將重新顯示在主要列表中。')) {
      return;
    }

    try {
      const noteRef = doc(firestoreDb, `artifacts/${firebaseConfig.projectId}/public/data/notes`, id);
      await updateDoc(noteRef, { is_archived: false, updated_at: new Date() }); // 將 is_archived 設為 false
      setMessage('筆記已成功解除歸檔！');
      setAlertSeverity('success');
      setAlertOpen(true);
    } catch (err) {
      console.error('解除歸檔筆記失敗:', err);
      setMessage(`解除歸檔筆記失敗：${err.message || '未知錯誤'}`);
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };


  // 處理編輯按鈕點擊事件
  const handleEditClick = (note) => {
    setEditingNote(note); // 將點擊的筆記設定為正在編輯的筆記
    setForm({ // 將筆記數據填充到表單中
      title: note.title,
      content: note.content,
      category: note.category,
      is_important: note.is_important,
      is_archived: note.is_archived // 載入歸檔狀態
    });
    setShowDialog(true); // 開啟編輯對話框
  };

  // 處理新增按鈕點擊事件
  const handleAddClick = () => {
    setEditingNote(null); // 清除任何先前的編輯狀態
    setForm({ title: '', content: '', category: '', is_important: false, is_archived: false }); // 清空表單，並確保 is_archived 預設為 false
    setShowDialog(true); // 開啟新增對話框
  };

  // 如果 Firebase 認證還在加載，顯示加載指示器
  if (loadingAuth) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>加載中...</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>正在連接資料庫並認證身份。</Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* 提供一致的 CSS 基準線 */}
      <AppBar position="static" sx={{ bgcolor: 'primary.dark', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <Toolbar>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, color: 'white' }}>
            我的筆記本 (公開模式)
          </Typography>
          <IconButton color="inherit" onClick={handleAddClick} aria-label="新增筆記" sx={{
            bgcolor: 'primary.light',
            '&:hover': { bgcolor: 'primary.main' },
            borderRadius: '50%',
            p: 1,
          }}>
            <Add sx={{ color: 'white' }} />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}> {/* 增加整體頁面邊距 */}
        <Grid container spacing={3} alignItems="center" sx={{ mb: 4 }}> {/* 增加間距和底部邊距 */}
          {/* 搜尋欄位 */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="搜尋標題或內容"
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ '& fieldset': { borderRadius: '8px' } }} // 圓角邊框
            />
          </Grid>
          {/* 分類過濾下拉選單 */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined" sx={{ '& fieldset': { borderRadius: '8px' } }}>
              <InputLabel id="category-filter-label">分類</InputLabel>
              <Select
                labelId="category-filter-label"
                value={categoryFilter}
                label="分類"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">所有</MenuItem>
                {/* 動態生成分類選項，從 Firestore 獲取的筆記中提取唯一分類 (過濾掉空值) */}
                {[...new Set(notes.map(n => n.category).filter(Boolean))].map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {/* 排序依據下拉選單 */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined" sx={{ '& fieldset': { borderRadius: '8px' } }}>
              <InputLabel id="sort-by-label">排序依據</InputLabel>
              <Select
                labelId="sort-by-label"
                value={sortBy}
                label="排序依據"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="">無</MenuItem>
                <MenuItem value="title">標題</MenuItem>
                <MenuItem value="content">內容</MenuItem>
                <MenuItem value="category">分類</MenuItem>
                <MenuItem value="is_important">重要性</MenuItem>
                <MenuItem value="created_at">創建時間</MenuItem>
                <MenuItem value="updated_at">更新時間</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {/* 排序順序下拉選單 */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined" sx={{ '& fieldset': { borderRadius: '8px' } }}>
              <InputLabel id="sort-order-label">排序順序</InputLabel>
              <Select
                labelId="sort-order-label"
                value={sortOrder}
                label="排序順序"
                onChange={(e) => setSortOrder(e.target.value)}
                disabled={!sortBy} // 如果沒有選擇排序依據，則禁用排序順序選單
              >
                <MenuItem value="asc">升序</MenuItem>
                <MenuItem value="desc">降序</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {/* 顯示已歸檔筆記的開關 */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  color="primary"
                />
              }
              label={<Typography variant="body1" color="text.primary">顯示已歸檔筆記</Typography>}
              sx={{ ml: 1, mt: 1 }}
            />
          </Grid>
        </Grid>

        {/* 筆記列表顯示區 */}
        <Grid container spacing={3}>
          {notes.length === 0 ? (
            // 如果沒有筆記則顯示提示訊息
            <Grid item xs={12}>
              <Box sx={{
                p: 4,
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 2,
                textAlign: 'center',
                mt: 4,
              }}>
                <Typography variant="h6" color="text.secondary">
                  目前沒有筆記。點擊右上角的 '+' 新增一個！
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  您的筆記將會顯示在這裡。
                </Typography>
              </Box>
            </Grid>
          ) : (
            // 遍歷筆記列表並顯示每個筆記卡片
            notes.map(note => (
              <Grid item xs={12} sm={6} md={4} key={note.id}>
                <Card sx={{
                  // 根據 is_important 屬性設定左側邊框顏色，增加視覺區分
                  borderLeft: note.is_important ? '6px solid #FFD700' : '6px solid #00BCD4', // 金色和青色邊框
                  opacity: note.is_archived ? 0.6 : 1, // 如果已歸檔，設置透明度
                  height: '100%', // 確保卡片高度一致
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div" sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1,
                      color: 'primary.dark'
                    }}>
                      {note.title}
                      {/* 如果筆記重要，則顯示星形圖標 */}
                      {note.is_important && <Star sx={{ color: '#FFD700', ml: 1, fontSize: '1.2rem' }} />}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                      {note.content}
                    </Typography>
                    {note.category && (
                      <Typography variant="caption" display="block" sx={{
                        mt: 1,
                        color: 'text.disabled',
                        bgcolor: 'rgba(0, 150, 136, 0.1)', // 帶透明度的背景色
                        borderRadius: '4px',
                        px: 1,
                        py: 0.5,
                        display: 'inline-block',
                      }}>
                        分類: {note.category}
                      </Typography>
                    )}
                    {/* 顯示時間戳 */}
                    {note.created_at && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontSize: '0.7rem' }}>
                            創建於: {note.created_at.toLocaleString()}
                        </Typography>
                    )}
                    {note.updated_at && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                            更新於: {note.updated_at.toLocaleString()}
                        </Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', p: 2, borderTop: '1px solid #eee' }}>
                    <IconButton aria-label="編輯筆記" onClick={() => handleEditClick(note)} sx={{
                      '&:hover': { bgcolor: 'rgba(103, 58, 183, 0.08)' }
                    }}>
                      <Edit color="primary" />
                    </IconButton>
                    {/* 根據筆記的歸檔狀態顯示不同的操作按鈕 */}
                    {note.is_archived ? (
                      <Button
                        variant="outlined"
                        size="small"
                        color="secondary"
                        onClick={() => handleUnarchive(note.id)}
                        startIcon={<UnarchiveOutlined />}
                        sx={{ ml: 1 }}
                      >
                        解除歸檔
                      </Button>
                    ) : (
                      <IconButton aria-label="歸檔筆記" onClick={() => handleArchive(note.id)} sx={{
                        '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.08)' }
                      }}>
                        <ArchiveOutlined color="error" /> {/* 使用 ArchiveOutlined 圖標表示歸檔 */}
                      </IconButton>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Container>

      {/* 新增/編輯筆記的對話框 */}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', pb: 2, pt: 2 }}>
          {editingNote ? '編輯筆記' : '新增筆記'}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}> {/* 增加內邊距 */}
          <TextField
            margin="dense"
            label="標題"
            fullWidth
            variant="outlined"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            sx={{ mb: 2, borderRadius: '8px' }}
            required
            error={!form.title.trim() && showDialog} // 簡單的即時驗證
            helperText={!form.title.trim() && showDialog ? '標題為必填項' : ''}
          />
          <TextField
            margin="dense"
            label="內容"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            sx={{ mb: 2, borderRadius: '8px' }}
            required
            error={!form.content.trim() && showDialog}
            helperText={!form.content.trim() && showDialog ? '內容為必填項' : ''}
          />
          <TextField
            margin="dense"
            label="分類"
            fullWidth
            variant="outlined"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            sx={{ mb: 2, borderRadius: '8px' }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.is_important}
                onChange={(e) => setForm({ ...form, is_important: e.target.checked })}
                color="primary"
                sx={{ '& .MuiSvgIcon-root': { fontSize: 26 } }} // 調整 checkbox 圖標大小
              />
            }
            label={<Typography variant="body1" color="text.primary">標記為重要</Typography>}
          />
          {editingNote && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.is_archived}
                  onChange={(e) => setForm({ ...form, is_archived: e.target.checked })}
                  color="secondary"
                  sx={{ '& .MuiSvgIcon-root': { fontSize: 26 } }}
                />
              }
              label={<Typography variant="body1" color="text.primary">已歸檔</Typography>}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowDialog(false)} color="secondary" variant="outlined">
            取消
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            儲存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 底部提示訊息 Snackbar */}
      <Snackbar open={alertOpen} autoHideDuration={3000} onClose={() => setAlertOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setAlertOpen(false)} severity={alertSeverity} variant="filled" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
