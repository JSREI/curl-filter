import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Delete,
  Favorite,
  FavoriteBorder,
  Search,
  Clear,
  ContentCopy,
  Visibility,
  Edit,
  FilterList,
  History as HistoryIcon,
  Star,
  StarBorder
} from '@mui/icons-material';
import type { HistoryEntry, HistoryQueryOptions, HistoryStats } from '../../types/filterRules';
import { indexedDBStorageManager } from '../../utils/indexedDBStorage';
import './HistoryManager.css';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`history-tabpanel-${index}`}
      aria-labelledby={`history-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

interface HistoryManagerProps {
  onSelectEntry?: (entry: HistoryEntry) => void;
}

const HistoryManager: React.FC<HistoryManagerProps> = ({ onSelectEntry }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 搜索和过滤状态
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'timestamp' | 'title'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 对话框状态
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  // 编辑状态
  const [editTitle, setEditTitle] = useState('');
  const [editTags, setEditTags] = useState('');

  // 加载历史记录
  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const queryOptions: HistoryQueryOptions = {
        limit: 100,
        searchText: searchText || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        favoriteOnly: favoriteOnly || undefined,
        sortBy,
        sortOrder
      };

      const [historyEntries, historyStats] = await Promise.all([
        indexedDBStorageManager.queryHistory(queryOptions),
        indexedDBStorageManager.getHistoryStats()
      ]);

      setEntries(historyEntries);
      setStats(historyStats);
    } catch (err) {
      setError('加载历史记录失败');
      console.error('加载历史记录失败:', err);
    } finally {
      setLoading(false);
    }
  }, [searchText, selectedTags, favoriteOnly, sortBy, sortOrder]);

  // 初始化加载
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // 切换收藏状态
  const toggleFavorite = useCallback(async (entry: HistoryEntry) => {
    try {
      const success = await indexedDBStorageManager.updateHistoryEntry(entry.id, {
        favorite: !entry.favorite
      });

      if (success) {
        setSuccess(entry.favorite ? '已取消收藏' : '已添加到收藏');
        loadHistory();
      } else {
        setError('更新收藏状态失败');
      }
    } catch (err) {
      setError('更新收藏状态失败');
      console.error('更新收藏状态失败:', err);
    }
  }, [loadHistory]);

  // 删除历史记录
  const deleteEntry = useCallback(async (id: string) => {
    try {
      const success = await indexedDBStorageManager.deleteHistoryEntry(id);
      if (success) {
        setSuccess('历史记录已删除');
        loadHistory();
        setDeleteDialogOpen(false);
        setSelectedEntry(null);
      } else {
        setError('删除历史记录失败');
      }
    } catch (err) {
      setError('删除历史记录失败');
      console.error('删除历史记录失败:', err);
    }
  }, [loadHistory]);

  // 复制到剪贴板
  const copyToClipboard = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess(`${type}已复制到剪贴板`);
    } catch (err) {
      setError('复制失败');
    }
  }, []);

  // 打开查看对话框
  const openViewDialog = useCallback((entry: HistoryEntry) => {
    setSelectedEntry(entry);
    setViewDialogOpen(true);
  }, []);

  // 打开编辑对话框
  const openEditDialog = useCallback((entry: HistoryEntry) => {
    setSelectedEntry(entry);
    setEditTitle(entry.title || '');
    setEditTags(entry.tags ? entry.tags.join(', ') : '');
    setEditDialogOpen(true);
  }, []);

  // 保存编辑
  const saveEdit = useCallback(async () => {
    if (!selectedEntry) return;

    try {
      const tags = editTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      const success = await indexedDBStorageManager.updateHistoryEntry(selectedEntry.id, {
        title: editTitle || undefined,
        tags: tags.length > 0 ? tags : undefined
      });

      if (success) {
        setSuccess('历史记录已更新');
        loadHistory();
        setEditDialogOpen(false);
        setSelectedEntry(null);
      } else {
        setError('更新历史记录失败');
      }
    } catch (err) {
      setError('更新历史记录失败');
      console.error('更新历史记录失败:', err);
    }
  }, [selectedEntry, editTitle, editTags, loadHistory]);

  // 清空搜索
  const clearSearch = useCallback(() => {
    setSearchText('');
    setSelectedTags([]);
    setFavoriteOnly(false);
  }, []);

  // 格式化时间
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 获取所有可用标签
  const availableTags = stats ? Object.keys(stats.tagsCount) : [];

  return (
    <Box className="history-manager">
      <Box className="history-header">
        <Typography variant="h5" component="h2" className="history-title">
          <HistoryIcon className="title-icon" />
          历史记录管理
        </Typography>
        
        {stats && (
          <Box className="history-stats">
            <Chip label={`总计: ${stats.totalEntries}`} size="small" />
            <Chip label={`收藏: ${stats.favoriteEntries}`} size="small" color="primary" />
            <Chip label={`标签: ${Object.keys(stats.tagsCount).length}`} size="small" color="secondary" />
          </Box>
        )}
      </Box>

      <Divider className="section-divider" />

      <Box className="history-tabs">
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab label="历史记录" />
          <Tab label="搜索过滤" />
          <Tab label="统计信息" />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        <Box className="history-list-section">
          {loading ? (
            <Typography>加载中...</Typography>
          ) : entries.length === 0 ? (
            <Alert severity="info">暂无历史记录</Alert>
          ) : (
            <List className="history-list">
              {entries.map((entry) => (
                <ListItem key={entry.id} className="history-item">
                  <ListItemText
                    primary={
                      <Box className="history-item-header">
                        <Typography variant="subtitle1" className="history-title">
                          {entry.title || '未命名记录'}
                        </Typography>
                        <Box className="history-item-actions">
                          {entry.favorite && <Star className="favorite-icon" />}
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(entry.timestamp)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box className="history-item-content">
                        <Typography variant="body2" className="curl-preview" noWrap>
                          {entry.inputCurl}
                        </Typography>
                        {entry.tags && entry.tags.length > 0 && (
                          <Box className="history-tags">
                            {entry.tags.map((tag) => (
                              <Chip key={tag} label={tag} size="small" variant="outlined" />
                            ))}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title={entry.favorite ? '取消收藏' : '添加收藏'}>
                      <IconButton onClick={() => toggleFavorite(entry)} size="small">
                        {entry.favorite ? <Favorite color="primary" /> : <FavoriteBorder />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="查看详情">
                      <IconButton onClick={() => openViewDialog(entry)} size="small">
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="编辑">
                      <IconButton onClick={() => openEditDialog(entry)} size="small">
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="删除">
                      <IconButton 
                        onClick={() => {
                          setSelectedEntry(entry);
                          setDeleteDialogOpen(true);
                        }} 
                        size="small"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <Box className="search-section">
          <Box className="search-controls">
            <TextField
              fullWidth
              variant="outlined"
              placeholder="搜索历史记录..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: <Search className="search-icon" />,
                endAdornment: searchText && (
                  <IconButton onClick={() => setSearchText('')} size="small">
                    <Clear />
                  </IconButton>
                )
              }}
              className="search-field"
            />

            <Box className="filter-controls">
              <FormControl size="small" className="sort-control">
                <InputLabel>排序方式</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'timestamp' | 'title')}
                  label="排序方式"
                >
                  <MenuItem value="timestamp">时间</MenuItem>
                  <MenuItem value="title">标题</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" className="order-control">
                <InputLabel>排序顺序</InputLabel>
                <Select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  label="排序顺序"
                >
                  <MenuItem value="desc">降序</MenuItem>
                  <MenuItem value="asc">升序</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={favoriteOnly}
                    onChange={(e) => setFavoriteOnly(e.target.checked)}
                  />
                }
                label="仅显示收藏"
              />

              <Button
                variant="outlined"
                onClick={clearSearch}
                startIcon={<Clear />}
                size="small"
              >
                清空筛选
              </Button>
            </Box>
          </Box>

          {availableTags.length > 0 && (
            <Box className="tags-section">
              <Typography variant="subtitle2" gutterBottom>
                按标签筛选:
              </Typography>
              <Box className="tags-chips">
                {availableTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={`${tag} (${stats?.tagsCount[tag]})`}
                    variant={selectedTags.includes(tag) ? "filled" : "outlined"}
                    color={selectedTags.includes(tag) ? "primary" : "default"}
                    onClick={() => {
                      if (selectedTags.includes(tag)) {
                        setSelectedTags(selectedTags.filter(t => t !== tag));
                      } else {
                        setSelectedTags([...selectedTags, tag]);
                      }
                    }}
                    size="small"
                    className="tag-chip"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <Box className="stats-section">
          {stats ? (
            <Box className="stats-content">
              <Paper className="stats-card">
                <Typography variant="h6" gutterBottom>基本统计</Typography>
                <Box className="stats-grid">
                  <Box className="stat-item">
                    <Typography variant="h4" color="primary">{stats.totalEntries}</Typography>
                    <Typography variant="body2" color="text.secondary">总记录数</Typography>
                  </Box>
                  <Box className="stat-item">
                    <Typography variant="h4" color="secondary">{stats.favoriteEntries}</Typography>
                    <Typography variant="body2" color="text.secondary">收藏记录</Typography>
                  </Box>
                  <Box className="stat-item">
                    <Typography variant="h4" color="info.main">{Object.keys(stats.tagsCount).length}</Typography>
                    <Typography variant="body2" color="text.secondary">标签数量</Typography>
                  </Box>
                </Box>
              </Paper>

              {Object.keys(stats.tagsCount).length > 0 && (
                <Paper className="stats-card">
                  <Typography variant="h6" gutterBottom>标签统计</Typography>
                  <Box className="tags-stats">
                    {Object.entries(stats.tagsCount)
                      .sort(([,a], [,b]) => b - a)
                      .map(([tag, count]) => (
                        <Box key={tag} className="tag-stat">
                          <Chip label={tag} size="small" />
                          <Typography variant="body2">{count} 次使用</Typography>
                        </Box>
                      ))}
                  </Box>
                </Paper>
              )}

              {stats.dateRange.earliest && (
                <Paper className="stats-card">
                  <Typography variant="h6" gutterBottom>时间范围</Typography>
                  <Typography variant="body2">
                    最早记录: {formatTime(stats.dateRange.earliest)}
                  </Typography>
                  <Typography variant="body2">
                    最新记录: {formatTime(stats.dateRange.latest)}
                  </Typography>
                </Paper>
              )}
            </Box>
          ) : (
            <Typography>加载统计信息中...</Typography>
          )}
        </Box>
      </TabPanel>

      {/* 查看详情对话框 */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>历史记录详情</DialogTitle>
        <DialogContent>
          {selectedEntry && (
            <Box className="entry-details">
              <Box className="detail-section">
                <Typography variant="h6" gutterBottom>基本信息</Typography>
                <Typography><strong>标题:</strong> {selectedEntry.title || '未命名'}</Typography>
                <Typography><strong>时间:</strong> {formatTime(selectedEntry.timestamp)}</Typography>
                <Typography><strong>收藏:</strong> {selectedEntry.favorite ? '是' : '否'}</Typography>
                {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                  <Box>
                    <Typography><strong>标签:</strong></Typography>
                    <Box className="detail-tags">
                      {selectedEntry.tags.map(tag => (
                        <Chip key={tag} label={tag} size="small" />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              <Box className="detail-section">
                <Box className="curl-section">
                  <Typography variant="h6" gutterBottom>
                    输入的 cURL 命令
                    <IconButton 
                      onClick={() => copyToClipboard(selectedEntry.inputCurl, '输入命令')}
                      size="small"
                    >
                      <ContentCopy />
                    </IconButton>
                  </Typography>
                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    value={selectedEntry.inputCurl}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Box>

                <Box className="curl-section">
                  <Typography variant="h6" gutterBottom>
                    过滤后的 cURL 命令
                    <IconButton 
                      onClick={() => copyToClipboard(selectedEntry.outputCurl, '输出命令')}
                      size="small"
                    >
                      <ContentCopy />
                    </IconButton>
                  </Typography>
                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    value={selectedEntry.outputCurl}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Box>
              </Box>

              <Box className="detail-section">
                <Typography variant="h6" gutterBottom>应用的规则</Typography>
                {selectedEntry.appliedRules.length > 0 ? (
                  <Box className="applied-rules">
                    {selectedEntry.appliedRules.map((ruleId, index) => (
                      <Chip key={index} label={ruleId} size="small" variant="outlined" />
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary">未应用任何规则</Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>关闭</Button>
          {onSelectEntry && selectedEntry && (
            <Button 
              onClick={() => {
                onSelectEntry(selectedEntry);
                setViewDialogOpen(false);
              }}
              variant="contained"
            >
              使用此记录
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>编辑历史记录</DialogTitle>
        <DialogContent>
          <Box className="edit-form">
            <TextField
              fullWidth
              label="标题"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              margin="normal"
              placeholder="为此记录添加标题..."
            />
            <TextField
              fullWidth
              label="标签"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              margin="normal"
              placeholder="用逗号分隔多个标签..."
              helperText="例如: 测试, API, 开发"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button onClick={saveEdit} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除这条历史记录吗？此操作无法撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button 
            onClick={() => selectedEntry && deleteEntry(selectedEntry.id)}
            color="error"
            variant="contained"
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 消息提示 */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HistoryManager;
