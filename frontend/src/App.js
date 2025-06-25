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
  Box // 引入 Box 組件用於靈活佈局和間距
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Add, Delete, Edit, Star, ArchiveOutlined, UnarchiveOutlined } from '@mui/icons-material'; // 引入新的圖標

// 後端 API 的基本 URL
const API_BASE_URL = 'http://localhost:8080';

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
  // 筆記列表的狀態
  const [notes, setNotes] = useState([]);
  // 搜尋關鍵字的狀態，會傳遞給後端 'query' 參數
  const [searchTerm, setSearchTerm] = useState('');
  // 分類過濾的狀態，會傳遞給後端 'category' 參數
  const [categoryFilter, setCategoryFilter] = useState('');
  // 排序依據的狀態 (e.g., 'title', 'category', 'is_important', 'created_at', 'updated_at')
  const [sortBy, setSortBy] = useState('');
  // 排序順序的狀態 ('asc' 或 'desc')
  const [sortOrder, setSortOrder] = useState('asc');
  // 控制是否顯示已歸檔筆記的狀態 (對應後端的 include_archived 參數)
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


  // 異步函數：從後端獲取筆記列表
  // 現在會根據 searchTerm, categoryFilter, sortBy, sortOrder, showArchived 構建查詢參數
  const fetchNotes = async () => {
    try {
      // 構建 URLSearchParams 物件以輕鬆管理查詢參數
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('query', searchTerm); // 搜尋關鍵字 (對應後端 title/content 搜尋)
      }
      if (categoryFilter) {
        params.append('category', categoryFilter); // 分類過濾
      }
      if (sortBy) {
        params.append('sort_by', sortBy); // 排序依據
        params.append('sort_order', sortOrder); // 排序順序
      }
      params.append('include_archived', showArchived); // 新增參數，控制是否顯示歸檔筆記

      // 構建完整的 API URL
      const url = `${API_BASE_URL}/notes?${params.toString()}`;
      // 發送 GET 請求
      const res = await fetch(url);

      // 檢查響應是否成功
      if (!res.ok) {
        throw new Error(`HTTP 錯誤！狀態碼: ${res.status}`);
      }

      // 解析 JSON 數據
      const data = await res.json();
      setNotes(data); // 更新筆記狀態
    } catch (err) {
      console.error('獲取筆記失敗:', err);
      setMessage('無法獲取筆記，請檢查後端服務是否運行或網路連接。');
      setAlertSeverity('error'); // 設置為錯誤提示
      setAlertOpen(true);
    }
  };

  // useEffect 鉤子：在組件加載或相關依賴項變化時執行
  // 這裡會在 searchTerm, categoryFilter, sortBy, sortOrder, showArchived 變化時重新獲取筆記
  useEffect(() => {
    fetchNotes();
  }, [searchTerm, categoryFilter, sortBy, sortOrder, showArchived]); // 新增 showArchived 到依賴項

  // 處理筆記表單提交 (新增或編輯)
  const handleSubmit = async () => {
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

    // 根據 editingNote 是否存在決定使用 PUT (更新) 或 POST (新增)
    const method = editingNote ? 'PUT' : 'POST';
    const url = editingNote ? `${API_BASE_URL}/notes/${editingNote.id}` : `${API_BASE_URL}/notes`;
    try {
      // 發送請求
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        // 在更新時，只發送表單中實際修改的字段，避免發送不必要的 created_at/updated_at
        body: JSON.stringify(editingNote ? {
          title: form.title,
          content: form.content,
          category: form.category,
          is_important: form.is_important,
          is_archived: form.is_archived // 也允許通過編輯對話框更新歸檔狀態
        } : form) // 新增時發送所有表單字段
      });

      if (!res.ok) {
        // 嘗試從響應中讀取錯誤訊息
        const errorData = await res.json();
        throw new Error(`HTTP 錯誤！狀態碼: ${res.status}, 詳情: ${errorData.detail || res.statusText}`);
      }

      await res.json(); // 確保讀取響應以完成請求
      fetchNotes(); // 重新獲取筆記，以便更新列表顯示
      setShowDialog(false); // 關閉對話框
      setForm({ title: '', content: '', category: '', is_important: false, is_archived: false }); // 重置表單為空
      setEditingNote(null); // 清除編輯狀態
      // 根據操作類型設置提示訊息
      setMessage(editingNote ? '筆記已成功更新！' : '筆記已成功新增！');
      setAlertSeverity('success'); // 設置為成功提示
      setAlertOpen(true); // 顯示成功提示
    } catch (err) {
      console.error('提交筆記失敗:', err);
      setMessage(`提交筆記失敗：${err.message || '未知錯誤'}`);
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  // 處理歸檔筆記 (原 handleDelete，現在對應後端的 DELETE /notes/{note_id})
  const handleArchive = async (id) => {
    if (!window.confirm('確定要歸檔這條筆記嗎？它將不再顯示在主要列表中，但可以從歸檔區恢復。')) {
      return;
    }

    try {
      // 發送 DELETE 請求以歸檔
      const res = await fetch(`${API_BASE_URL}/notes/${id}`, { method: 'DELETE' });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`HTTP 錯誤！狀態碼: ${res.status}, 詳情: ${errorData.detail || res.statusText}`);
      }

      fetchNotes(); // 重新獲取筆記，以便列表立即反映歸檔操作
      setMessage('筆記已成功歸檔！');
      setAlertSeverity('success');
      setAlertOpen(true); // 顯示成功提示
    } catch (err) {
      console.error('歸檔筆記失敗:', err);
      setMessage(`歸檔筆記失敗：${err.message || '未知錯誤'}`);
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  // 處理解除歸檔筆記 (對應後端的 PATCH /notes/{note_id}/unarchive)
  const handleUnarchive = async (id) => {
    if (!window.confirm('確定要解除歸檔這條筆記嗎？它將重新顯示在主要列表中。')) {
      return;
    }

    try {
      // 發送 PATCH 請求以解除歸檔
      const res = await fetch(`${API_BASE_URL}/notes/${id}/unarchive`, { method: 'PATCH' });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`HTTP 錯誤！狀態碼: ${res.status}, 詳情: ${errorData.detail || res.statusText}`);
      }

      fetchNotes(); // 重新獲取筆記，以便列表立即反映解除歸檔操作
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
    setForm(note); // 將該筆記的數據填充到表單中
    setShowDialog(true); // 開啟編輯對話框
  };

  // 處理新增按鈕點擊事件
  const handleAddClick = () => {
    setEditingNote(null); // 清除任何先前的編輯狀態
    setForm({ title: '', content: '', category: '', is_important: false, is_archived: false }); // 清空表單，並確保 is_archived 預設為 false
    setShowDialog(true); // 開啟新增對話框
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* 提供一致的 CSS 基準線 */}
      <AppBar position="static" sx={{ bgcolor: 'primary.dark', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <Toolbar>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, color: 'white' }}>
            我的筆記本
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
                {/* 動態生成分類選項，從現有筆記中提取唯一分類 (過濾掉空值) */}
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
                <MenuItem value="category">分類</MenuItem>
                <MenuItem value="is_important">重要性</MenuItem>
                <MenuItem value="created_at">創建時間</MenuItem> {/* 新增排序選項 */}
                <MenuItem value="updated_at">更新時間</MenuItem> {/* 新增排序選項 */}
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
              label={<Typography variant="body1" color="text.primary">顯示已歸檔筆記 (包含已軟刪除)</Typography>}
              sx={{ ml: 1, mt: 1 }} // Adjust margin
            />
          </Grid>
        </Grid>

        {/* 筆記列表顯示區 */}
        <Grid container spacing={3}> {/* 增加卡片之間的間距 */}
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
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, fontSize: '0.7rem' }}>
                      創建於: {new Date(note.created_at).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                      更新於: {new Date(note.updated_at).toLocaleString()}
                    </Typography>
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
          {/* 在編輯模式下顯示歸檔選項 */}
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
