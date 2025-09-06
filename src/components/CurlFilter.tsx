import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Chip,
  Alert,
  Snackbar,
  FormControlLabel,
  Switch,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ContentCopy,
  Clear,
  FilterList,
  Info
} from '@mui/icons-material';
import { parseCurl, filterHeaders, buildCurl, getFilterRules } from '../utils/curlParser';
import './CurlFilter.css';

const CurlFilter: React.FC = () => {
  const [inputCurl, setInputCurl] = useState('');
  const [outputCurl, setOutputCurl] = useState('');
  const [customHeaders, setCustomHeaders] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterRules] = useState(getFilterRules());

  const handleFilter = useCallback(() => {
    try {
      if (!inputCurl.trim()) {
        setError('请输入curl命令');
        return;
      }

      const parsed = parseCurl(inputCurl);
      
      if (!parsed.url) {
        setError('无法解析URL，请检查curl命令格式');
        return;
      }

      const customKeepHeaders = customHeaders
        .split(',')
        .map(h => h.trim())
        .filter(h => h.length > 0);

      const filtered = filterHeaders(parsed.headers, customKeepHeaders);
      const result = buildCurl({ ...parsed, headers: filtered }, filtered);
      
      setOutputCurl(result);
      setError('');
      setSuccess('curl命令过滤完成');
    } catch (err) {
      setError('解析curl命令时出错: ' + (err as Error).message);
    }
  }, [inputCurl, customHeaders]);

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
    setError('');
    setSuccess('');
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  return (
    <Box className="curl-filter-container">
      <Paper elevation={3} className="curl-filter-paper">
        <Box className="header-section">
          <Typography variant="h4" component="h1" className="title">
            <FilterList className="title-icon" />
            Curl 请求头过滤器
          </Typography>
          <Typography variant="body1" color="text.secondary" className="subtitle">
            过滤Chrome "Copy as cURL"中的无关请求头，保留认证和业务相关的请求头
          </Typography>
        </Box>

        <Divider className="section-divider" />

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
            onChange={(e) => setInputCurl(e.target.value)}
            className="input-field"
          />
        </Box>

        <Box className="controls-section">
          <Box className="main-controls">
            <Button
              variant="contained"
              color="primary"
              onClick={handleFilter}
              disabled={!inputCurl.trim()}
              className="filter-button"
            >
              <FilterList className="button-icon" />
              过滤请求头
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

          <FormControlLabel
            control={
              <Switch
                checked={showAdvanced}
                onChange={(e) => setShowAdvanced(e.target.checked)}
              />
            }
            label="高级选项"
            className="advanced-toggle"
          />
        </Box>

        {showAdvanced && (
          <Box className="advanced-section">
            <Typography variant="h6" className="section-title">
              自定义保留的请求头
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="输入额外需要保留的请求头名称，用逗号分隔，如: x-custom-header, x-trace-id"
              value={customHeaders}
              onChange={(e) => setCustomHeaders(e.target.value)}
              className="custom-headers-field"
            />
          </Box>
        )}

        <Box className="rules-section">
          <Typography variant="h6" className="section-title">
            <Info className="section-icon" />
            过滤规则
          </Typography>
          <Box className="rules-chips">
            {filterRules.map((rule, index) => (
              <Chip
                key={index}
                label={rule}
                variant="outlined"
                className="rule-chip"
              />
            ))}
          </Box>
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
            </Box>
          </>
        )}
      </Paper>

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