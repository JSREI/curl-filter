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
  Settings as SettingsIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import { parseCurl } from '../utils/curlParser';
import { FilterEngine } from '../utils/filterEngine';
import type { FilterRule, FilterContext, FilterResult } from '../types/filterRules';
import { loadRules } from '../utils/ruleStorage';
import RuleManager from './RuleManager/RuleManager';
import RulePreview from './RuleManager/RulePreview';
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
  const [inputCurl, setInputCurl] = useState('');
  const [outputCurl, setOutputCurl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [isRuleManagerOpen, setIsRuleManagerOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 过滤相关状态
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [filterEngine] = useState<FilterEngine>(new FilterEngine());
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);

  // 防抖定时器引用
  const debounceTimerRef = useRef<number | null>(null);

  // 加载规则
  const loadFilterRules = useCallback(() => {
    try {
      const loadedRules = loadRules();
      setRules(loadedRules);
      filterEngine.setRules(loadedRules);
    } catch (err) {
      setError('加载过滤规则失败');
    }
  }, [filterEngine]);

  // 初始化加载规则
  useEffect(() => {
    loadFilterRules();
  }, [loadFilterRules]);

  const handleFilter = useCallback((curlText?: string) => {
    try {
      const textToProcess = curlText || inputCurl;

      if (!textToProcess.trim()) {
        setError('请输入curl命令');
        return;
      }

      const parsed = parseCurl(textToProcess);

      if (!parsed.url) {
        setError('无法解析URL，请检查curl命令格式');
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

      // 重新构建curl命令
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
      setSuccess(`curl命令过滤完成，应用了 ${result.appliedRules.length} 个规则`);

      if (result.warnings.length > 0) {
        console.warn('过滤警告:', result.warnings);
      }
    } catch (err) {
      setError('解析curl命令时出错: ' + (err as Error).message);
    }
  }, [inputCurl, filterEngine]);

  // 自动过滤函数（带防抖）
  const autoFilter = useCallback((curlText: string) => {
    // 清除之前的定时器
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    // 设置新的防抖定时器
    debounceTimerRef.current = window.setTimeout(() => {
      // 检查是否有有效的curl命令和启用的规则
      if (curlText.trim() && rules.filter(r => r.enabled).length > 0) {
        // 检查是否看起来像curl命令
        if (curlText.trim().toLowerCase().startsWith('curl')) {
          handleFilter(curlText);
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
  const handleRulesChange = useCallback((newRules: FilterRule[]) => {
    setRules(newRules);
    filterEngine.setRules(newRules);
    // 如果有输入内容，自动重新过滤
    if (inputCurl.trim()) {
      // 直接调用handleFilter而不是autoFilter，避免循环依赖
      handleFilter(inputCurl);
    }
  }, [filterEngine, inputCurl, handleFilter]);

  // 从过滤上下文构建curl命令
  const buildCurlFromContext = (parsed: any): string => {
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
      setSuccess('已复制到剪贴板');
    } catch (err) {
      setError('复制失败，请手动复制');
    }
  }, [outputCurl]);

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

  // 处理输入变化
  const handleInputChange = useCallback((value: string) => {
    setInputCurl(value);
    // 触发自动过滤
    autoFilter(value);
  }, [autoFilter]);

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

  return (
    <Box className="curl-filter-container">
      <Paper elevation={3} className="curl-filter-paper">
        <Box className="header-section">
          <Typography variant="h4" component="h1" className="title">
            <FilterList className="title-icon" />
            Curl 过滤器
          </Typography>
          <Typography variant="body1" color="text.secondary" className="subtitle">
            使用可配置的规则过滤curl命令，支持请求头、查询参数、表单数据和JSON请求体
          </Typography>

          <Box className="header-actions">
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={handleOpenRuleManager}
              size="small"
            >
              规则管理
            </Button>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={handleOpenPreview}
              disabled={!inputCurl.trim()}
              size="small"
            >
              预览效果
            </Button>
          </Box>
        </Box>

        <Divider className="section-divider" />

        <Box className="tabs-section">
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab label="过滤工具" />
            <Tab label={`规则状态 (${rules.filter(r => r.enabled).length}/${rules.length})`} />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <Box className="input-section">
            <Typography variant="h6" className="section-title">
              输入 cURL 命令
            </Typography>
            <TextField
              multiline
              rows={6}
              fullWidth
              variant="outlined"
              placeholder="粘贴你的 curl 命令到这里..."
              value={inputCurl}
              onChange={(e) => handleInputChange(e.target.value)}
              className="input-field"
            />
          </Box>

          <Box className="controls-section">
            <Box className="main-controls">
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleFilter()}
                disabled={!inputCurl.trim() || rules.filter(r => r.enabled).length === 0}
                className="filter-button"
              >
                <FilterList className="button-icon" />
                应用过滤规则
              </Button>
              <Button
                variant="outlined"
                onClick={handleClear}
                className="clear-button"
              >
                <Clear className="button-icon" />
                清空
              </Button>
            </Box>

            {rules.filter(r => r.enabled).length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                没有启用的过滤规则，请先在规则管理中配置规则
              </Alert>
            )}
          </Box>

          {outputCurl && (
            <>
              <Divider className="section-divider" />
              <Box className="output-section">
                <Box className="output-header">
                  <Typography variant="h6" className="section-title">
                    过滤后的 cURL 命令
                  </Typography>
                  <Tooltip title="复制到剪贴板">
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
                      应用了 {filterResult.appliedRules.length} 个规则
                      {filterResult.warnings.length > 0 && ` | ${filterResult.warnings.length} 个警告`}
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
              当前规则状态
            </Typography>

            {rules.length === 0 ? (
              <Alert severity="info">
                暂无配置规则，请点击"规则管理"添加过滤规则
              </Alert>
            ) : (
              <Box className="rules-chips">
                {rules.map((rule) => (
                  <Chip
                    key={rule.id}
                    label={`${rule.name} (优先级: ${rule.priority})`}
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
                总规则数: {rules.length} |
                启用: {rules.filter(r => r.enabled).length} |
                禁用: {rules.filter(r => !r.enabled).length}
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
        <DialogTitle>过滤规则管理</DialogTitle>
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
        <DialogTitle>过滤效果预览</DialogTitle>
        <DialogContent>
          {inputCurl && (
            <RulePreview
              curlCommand={inputCurl}
              rules={rules.filter(r => r.enabled)}
            />
          )}
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