import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Chip,
  Alert,
  Snackbar,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import {
  ContentCopy,
  Clear,
  FilterList,
  Info,
  Settings,
  Settings as SettingsIcon,
  Preview as PreviewIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import GitHubIcon from './GitHubIcon';
import LanguageSwitcher from './LanguageSwitcher';
import { parseCurl, type ParsedCurl } from '../utils/curlParser';
import { FilterEngine } from '../utils/filterEngine';
import type { FilterRule, FilterContext, FilterResult } from '../types/filterRules';
import { loadRules } from '../utils/ruleStorage';
import { saveHistoryEntry } from '../utils/indexedDBStorage';
import RuleManager from './RuleManager/RuleManager';
import RulePreview from './RuleManager/RulePreview';
import HistoryManager from './HistoryManager/HistoryManager';
import { useTranslation } from 'react-i18next';
import './CurlFilter.css';

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
      id={`curl-tabpanel-${index}`}
      aria-labelledby={`curl-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const CurlFilter: React.FC = () => {
  const { t } = useTranslation();
  const [inputCurl, setInputCurl] = useState('');
  const [outputCurl, setOutputCurl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inputValidation, setInputValidation] = useState<{
    isValid: boolean;
    message: string;
    severity: 'error' | 'warning' | 'info';
  } | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [isRuleManagerOpen, setIsRuleManagerOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHistoryManagerOpen, setIsHistoryManagerOpen] = useState(false);

  // 过滤相关状态
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [filterEngine] = useState<FilterEngine>(new FilterEngine());
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);

  // 防抖定时器引用
  const debounceTimerRef = useRef<number | null>(null);

  // 加载规则
  const loadFilterRules = useCallback(async () => {
    try {
      const loadedRules = await loadRules();
      setRules(loadedRules);
      filterEngine.setRules(loadedRules);
    } catch (error) {
      console.error('加载过滤规则失败:', error);
      setError('加载过滤规则失败');
    }
  }, [filterEngine]);

  // 初始化加载规则
  useEffect(() => {
    loadFilterRules();
  }, [loadFilterRules]);

  const handleFilter = useCallback(async (curlText?: string) => {
    try {
      const textToProcess = curlText || inputCurl;

      if (!textToProcess.trim()) {
        setError(t('messages.inputRequired'));
        return;
      }

      const parsed = parseCurl(textToProcess);

      if (!parsed.url) {
        setError(t('messages.parseUrlError'));
        return;
      }

      // 创建过滤上下文
      const context: FilterContext = {
        headers: parsed.headers,
        queryParams: parsed.queryParams,
        formData: parsed.formData,
        jsonBody: parsed.jsonBody,
        url: parsed.url,
        method: parsed.method
      };

      // 应用过滤规则
      const result = filterEngine.applyFilters(context);
      setFilterResult(result);

      // 重新构建cURL命令
      const filteredParsed = {
        ...parsed,
        headers: result.headers,
        queryParams: result.queryParams,
        formData: result.formData,
        jsonBody: result.jsonBody
      };

      const newCurl = buildCurlFromContext(filteredParsed);
      setOutputCurl(newCurl);
      setError('');
      setSuccess(t('messages.filterComplete', { count: result.appliedRules.length }));

      // 保存到历史记录
      try {
        await saveHistoryEntry(
          textToProcess,
          newCurl,
          result.appliedRules,
          result
        );
      } catch (historyError) {
        console.warn(t('messages.saveHistoryFailed'), historyError);
      }

      if (result.warnings.length > 0) {
        console.warn('过滤警告:', result.warnings);
      }
    } catch (err) {
      setError(t('messages.parseError', { error: (err as Error).message }));
    }
  }, [inputCurl, filterEngine, t]);

  // 自动过滤函数（带防抖）
  const autoFilter = useCallback((curlText: string) => {
    // 清除之前的定时器
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    // 设置新的防抖定时器
    debounceTimerRef.current = window.setTimeout(async () => {
      // 检查是否有有效的cURL命令和启用的规则
      if (curlText.trim() && rules && Array.isArray(rules) && rules.filter(r => r.enabled).length > 0) {
        // 检查是否看起来像cURL命令
        if (curlText.trim().toLowerCase().startsWith('curl')) {
          await handleFilter(curlText);
        }
      }
    }, 800); // 800ms防抖延迟
  }, [handleFilter, rules]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 处理规则变更
  const handleRulesChange = useCallback(async (newRules: FilterRule[]) => {
    setRules(newRules);
    filterEngine.setRules(newRules);
    // 如果有输入内容，自动重新过滤
    if (inputCurl.trim()) {
      // 直接调用handleFilter而不是autoFilter，避免循环依赖
      await handleFilter(inputCurl);
    }
  }, [filterEngine, inputCurl, handleFilter]);

  // 从过滤上下文构建cURL命令
  const buildCurlFromContext = (parsed: ParsedCurl): string => {
    let command = 'curl';

    // 添加方法
    if (parsed.method !== 'GET') {
      command += ` -X ${parsed.method}`;
    }

    // 添加请求头
    Object.entries(parsed.headers).forEach(([key, value]) => {
      command += ` -H "${key}: ${value}"`;
    });

    // 添加查询参数到URL
    let url = parsed.url;
    const queryString = Object.entries(parsed.queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`)
      .join('&');

    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }

    // 添加请求体数据
    if (parsed.jsonBody && Object.keys(parsed.jsonBody).length > 0) {
      command += ` -d '${JSON.stringify(parsed.jsonBody)}'`;
    } else if (parsed.formData && Object.keys(parsed.formData).length > 0) {
      const formString = Object.entries(parsed.formData)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`)
        .join('&');
      command += ` -d "${formString}"`;
    } else if (parsed.data) {
      command += ` -d "${parsed.data}"`;
    }

    // 添加URL
    command += ` "${url}"`;

    return command;
  };

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(outputCurl);
      setSuccess(t('messages.copySuccess'));
    } catch (error) {
      console.error('复制失败:', error);
      setError(t('messages.copyFailed'));
    }
  }, [outputCurl, t]);

  const handleClear = useCallback(() => {
    setInputCurl('');
    setOutputCurl('');
    setFilterResult(null);
    setError('');
    setSuccess('');
    // 清除防抖定时器
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // 验证cURL输入
  const validateCurlInput = useCallback((value: string) => {
    if (!value.trim()) {
      setInputValidation(null);
      return;
    }

    const trimmedValue = value.trim();

    if (!trimmedValue.startsWith('curl')) {
      setInputValidation({
        isValid: false,
        message: '输入应该以 "curl" 开头',
        severity: 'error'
      });
      return;
    }

    if (!trimmedValue.includes('http')) {
      setInputValidation({
        isValid: false,
        message: '未检测到有效的URL',
        severity: 'error'
      });
      return;
    }

    // 检查是否包含常见的Chrome复制特征
    const chromeFeatures = ['-H', '--header', '-X', '--request', '-d', '--data'];
    const hasFeatures = chromeFeatures.some(feature => trimmedValue.includes(feature));

    if (!hasFeatures) {
      setInputValidation({
        isValid: true,
        message: '这看起来是一个简单的cURL命令，可能不需要过滤',
        severity: 'info'
      });
      return;
    }

    setInputValidation({
      isValid: true,
      message: '检测到有效的cURL命令',
      severity: 'info'
    });
  }, []);

  // 处理输入变化
  const handleInputChange = useCallback((value: string) => {
    setInputCurl(value);
    setError('');
    setSuccess('');

    // 验证输入
    validateCurlInput(value);

    // 触发自动过滤
    autoFilter(value);
  }, [autoFilter, validateCurlInput]);

  const handleCloseSnackbar = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  const handleOpenRuleManager = () => {
    setIsRuleManagerOpen(true);
  };

  const handleOpenPreview = () => {
    if (inputCurl.trim()) {
      setIsPreviewOpen(true);
    } else {
      setError('请先输入curl命令');
    }
  };

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Enter: 应用过滤规则
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (inputCurl.trim() && rules && Array.isArray(rules) && rules.filter(r => r.enabled).length > 0) {
          handleFilter();
        }
      }

      // Ctrl/Cmd + K: 清空输入
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        handleClear();
      }

      // Ctrl/Cmd + M: 打开规则管理
      if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
        event.preventDefault();
        handleOpenRuleManager();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [inputCurl, rules, handleFilter, handleClear, handleOpenRuleManager]);

  return (
    <Box className="curl-filter-container">
      <Paper elevation={3} className="curl-filter-paper">
        <Box className="header-section">
          <Box className="header-content">
            <Box className="header-text">
              <Typography variant="h4" component="h1" className="title">
                <FilterList className="title-icon" />
                {t('app.title')}
              </Typography>
              <Typography variant="body1" color="text.secondary" className="subtitle">
                {t('app.subtitle')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LanguageSwitcher />
              <Tooltip title={t('tooltips.viewSourceCode')}>
                <IconButton
                  onClick={() => window.open('https://github.com/JSREI/curl-filter', '_blank')}
                  color="primary"
                  className="github-button"
                  size="large"
                >
                  <GitHubIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box className="header-actions">
            <Tooltip title="管理过滤规则，添加、编辑或删除规则 (Ctrl+M)">
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={handleOpenRuleManager}
                size="small"
              >
                {t('buttons.ruleManagement')}
              </Button>
            </Tooltip>
            <Tooltip title={!inputCurl.trim() ? '请先输入cURL命令' : '预览过滤效果'}>
              <span>
                <Button
                  variant="outlined"
                  startIcon={<PreviewIcon />}
                  onClick={handleOpenPreview}
                  disabled={!inputCurl.trim()}
                  size="small"
                >
                  {t('buttons.previewEffect')}
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="查看历史过滤记录">
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={() => setIsHistoryManagerOpen(true)}
                size="small"
              >
                {t('buttons.historyRecord')}
              </Button>
            </Tooltip>
          </Box>
        </Box>

        <Divider className="section-divider" />

        <Box className="tabs-section">
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab label={t('tabs.filterTool')} />
            <Tab label={t('tabs.ruleStatus', {
              enabled: rules && Array.isArray(rules) ? rules.filter(r => r.enabled).length : 0,
              total: rules && Array.isArray(rules) ? rules.length : 0
            })} />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <Box className="input-section">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" className="section-title">
                {t('input.curlCommand')}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  const exampleCurl = `curl 'https://api.example.com/users?page=1&limit=10' \\
  -H 'accept: application/json, text/plain, */*' \\
  -H 'accept-language: zh-CN,zh;q=0.9,en;q=0.8' \\
  -H 'authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \\
  -H 'cache-control: no-cache' \\
  -H 'content-type: application/json' \\
  -H 'cookie: session_id=abc123; user_pref=dark_mode' \\
  -H 'pragma: no-cache' \\
  -H 'referer: https://example.com/dashboard' \\
  -H 'sec-ch-ua: "Chrome";v="120", "Chromium";v="120"' \\
  -H 'sec-ch-ua-mobile: ?0' \\
  -H 'sec-ch-ua-platform: "macOS"' \\
  -H 'sec-fetch-dest: empty' \\
  -H 'sec-fetch-mode: cors' \\
  -H 'sec-fetch-site: cross-site' \\
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' \\
  --compressed`;
                  handleInputChange(exampleCurl);
                }}
                sx={{ textTransform: 'none' }}
              >
                使用示例
              </Button>
            </Box>
            <TextField
              multiline
              rows={6}
              fullWidth
              variant="outlined"
              placeholder={t('input.placeholder')}
              value={inputCurl}
              onChange={(e) => handleInputChange(e.target.value)}
              className="input-field"
            />

            {inputValidation && (
              <Alert
                severity={inputValidation.severity}
                sx={{ mt: 1 }}
                variant="outlined"
              >
                {inputValidation.message}
              </Alert>
            )}
          </Box>

          <Box className="controls-section">
            <Box className="main-controls">
              <Tooltip
                title={
                  !inputCurl.trim()
                    ? '请先输入cURL命令'
                    : (!rules || !Array.isArray(rules) || rules.filter(r => r.enabled).length === 0)
                      ? '请先配置并启用过滤规则'
                      : '应用过滤规则 (Ctrl+Enter)'
                }
              >
                <span>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleFilter()}
                    disabled={!inputCurl.trim() || !rules || !Array.isArray(rules) || rules.filter(r => r.enabled).length === 0}
                    className="filter-button"
                  >
                    <FilterList className="button-icon" />
                    {t('buttons.applyFilter')}
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="清空输入内容 (Ctrl+K)">
                <Button
                  variant="outlined"
                  onClick={handleClear}
                  className="clear-button"
                >
                  <Clear className="button-icon" />
                  {t('buttons.clear')}
                </Button>
              </Tooltip>
            </Box>

            {(!rules || !Array.isArray(rules) || rules.length === 0) && (
              <Alert
                severity="info"
                sx={{ mt: 2 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => setIsRuleManagerOpen(true)}
                    startIcon={<Settings />}
                  >
                    {t('buttons.ruleManagement')}
                  </Button>
                }
              >
                {t('messages.noRules')}
              </Alert>
            )}

            {rules && Array.isArray(rules) && rules.length > 0 && rules.filter(r => r.enabled).length === 0 && (
              <Alert
                severity="warning"
                sx={{ mt: 2 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => setIsRuleManagerOpen(true)}
                    startIcon={<Settings />}
                  >
                    {t('buttons.ruleManagement')}
                  </Button>
                }
              >
                {t('messages.noEnabledRules')}
              </Alert>
            )}
          </Box>

          {outputCurl && (
            <>
              <Divider className="section-divider" />
              <Box className="output-section">
                <Box className="output-header">
                  <Typography variant="h6" className="section-title">
                    {t('input.filteredCommand')}
                  </Typography>
                  <Tooltip title={t('tooltips.copyToClipboard')}>
                    <IconButton
                      onClick={handleCopy}
                      color="primary"
                      className="copy-button"
                    >
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                </Box>
                <TextField
                  multiline
                  rows={6}
                  fullWidth
                  variant="outlined"
                  value={outputCurl}
                  InputProps={{
                    readOnly: true,
                  }}
                  className="output-field"
                />

                {filterResult && (
                  <Box className="filter-summary" sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('rules.appliedRules', { count: filterResult.appliedRules.length })}
                      {filterResult.warnings.length > 0 && ` | ${t('rules.warnings', { count: filterResult.warnings.length })}`}
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
          )}
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Box className="rules-status-section">
            <Typography variant="h6" className="section-title" gutterBottom>
              <Info className="section-icon" />
              {t('rules.currentStatus')}
            </Typography>

            {!rules || !Array.isArray(rules) || rules.length === 0 ? (
              <Alert severity="info">
                {t('messages.noRules')}
              </Alert>
            ) : (
              <Box className="rules-chips">
                {rules.map((rule) => (
                  <Chip
                    key={rule.id}
                    label={`${rule.name} (${t('rules.priority', { priority: rule.priority })})`}
                    variant={rule.enabled ? "filled" : "outlined"}
                    color={rule.enabled ? "primary" : "default"}
                    className="rule-chip"
                    size="small"
                  />
                ))}
              </Box>
            )}

            <Box className="rules-summary" sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('rules.totalRules', { total: rules && Array.isArray(rules) ? rules.length : 0 })} |
                {t('rules.enabled', { count: rules && Array.isArray(rules) ? rules.filter(r => r.enabled).length : 0 })} |
                {t('rules.disabled', { count: rules && Array.isArray(rules) ? rules.filter(r => !r.enabled).length : 0 })}
              </Typography>
            </Box>
          </Box>
        </TabPanel>

      </Paper>

      {/* 规则管理对话框 */}
      <Dialog
        open={isRuleManagerOpen}
        onClose={() => setIsRuleManagerOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>{t('dialogs.filterRuleManagement')}</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <RuleManager onRulesChange={handleRulesChange} />
        </DialogContent>
      </Dialog>

      {/* 预览对话框 */}
      <Dialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>{t('dialogs.filterEffectPreview')}</DialogTitle>
        <DialogContent>
          {inputCurl && (
            <RulePreview
              curlCommand={inputCurl}
              rules={rules && Array.isArray(rules) ? rules.filter(r => r.enabled) : []}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 历史记录管理对话框 */}
      <Dialog
        open={isHistoryManagerOpen}
        onClose={() => setIsHistoryManagerOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>历史记录管理</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <HistoryManager
            onSelectEntry={(entry) => {
              setInputCurl(entry.inputCurl);
              setIsHistoryManagerOpen(false);
              setSuccess('已从历史记录加载cURL命令');
            }}
          />
        </DialogContent>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CurlFilter;