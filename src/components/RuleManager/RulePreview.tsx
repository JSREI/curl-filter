import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Divider,
  TextField
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

import type { FilterRule, FilterContext, FilterResult } from '../../types/filterRules';
import { parseCurl } from '../../utils/curlParser';
import { FilterEngine } from '../../utils/filterEngine';

interface RulePreviewProps {
  curlCommand: string;
  rules: FilterRule[];
}

const RulePreview: React.FC<RulePreviewProps> = ({
  curlCommand,
  rules
}) => {
  const [originalContext, setOriginalContext] = useState<FilterContext | null>(null);
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    try {
      if (!curlCommand.trim()) {
        setError('请输入cURL命令');
        return;
      }

      const parsed = parseCurl(curlCommand);
      
      if (!parsed.url) {
        setError('无法解析URL，请检查cURL命令格式');
        return;
      }

      const context: FilterContext = {
        headers: parsed.headers,
        queryParams: parsed.queryParams,
        formData: parsed.formData,
        jsonBody: parsed.jsonBody,
        url: parsed.url,
        method: parsed.method
      };

      setOriginalContext(context);

      // 应用过滤规则
      const engine = new FilterEngine(rules);
      const result = engine.applyFilters(context);
      setFilterResult(result);
      setError('');
    } catch (err) {
      setError('解析cURL命令时出错: ' + (err as Error).message);
    }
  }, [curlCommand, rules]);

  const renderDataComparison = (
    title: string,
    originalData: Record<string, any>,
    filteredData: Record<string, any>
  ) => {
    const originalKeys = Object.keys(originalData);
    const filteredKeys = Object.keys(filteredData);
    const allKeys = Array.from(new Set([...originalKeys, ...filteredKeys]));

    if (allKeys.length === 0) {
      return (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            无数据
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>字段名</TableCell>
                <TableCell>原始值</TableCell>
                <TableCell>过滤后</TableCell>
                <TableCell width="80px">状态</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allKeys.map((key) => {
                const originalValue = originalData[key];
                const filteredValue = filteredData[key];
                const isKept = filteredValue !== undefined;
                const isRemoved = originalValue !== undefined && filteredValue === undefined;
                const isAdded = originalValue === undefined && filteredValue !== undefined;

                return (
                  <TableRow key={key}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {key}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {originalValue !== undefined ? String(originalValue) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {filteredValue !== undefined ? String(filteredValue) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {isKept && !isAdded && (
                        <Chip
                          icon={<CheckIcon />}
                          label="保留"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {isRemoved && (
                        <Chip
                          icon={<CancelIcon />}
                          label="删除"
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {isAdded && (
                        <Chip
                          icon={<WarningIcon />}
                          label="新增"
                          color="warning"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderJsonComparison = (originalJson: any, filteredJson: any) => {
    if (!originalJson && !filteredJson) {
      return (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            JSON 请求体
          </Typography>
          <Typography variant="body2" color="text.secondary">
            无JSON数据
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          JSON 请求体
        </Typography>
        <Grid container spacing={2}>
          <Grid size={6}>
            <Typography variant="subtitle2" gutterBottom>
              原始JSON
            </Typography>
            <TextField
              multiline
              rows={6}
              fullWidth
              variant="outlined"
              value={originalJson ? JSON.stringify(originalJson, null, 2) : ''}
              InputProps={{ readOnly: true }}
              size="small"
            />
          </Grid>
          <Grid size={6}>
            <Typography variant="subtitle2" gutterBottom>
              过滤后JSON
            </Typography>
            <TextField
              multiline
              rows={6}
              fullWidth
              variant="outlined"
              value={filteredJson ? JSON.stringify(filteredJson, null, 2) : ''}
              InputProps={{ readOnly: true }}
              size="small"
            />
          </Grid>
        </Grid>
      </Box>
    );
  };

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!originalContext || !filterResult) {
    return (
      <Typography variant="body2" color="text.secondary">
        正在解析cURL命令...
      </Typography>
    );
  }

  return (
    <Box className="rule-preview">
      {/* 过滤摘要 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          过滤摘要
        </Typography>
        <Grid container spacing={2}>
          <Grid size={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {filterResult.appliedRules.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                应用规则数
              </Typography>
            </Paper>
          </Grid>
          <Grid size={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {Object.keys(filterResult.headers).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                保留请求头
              </Typography>
            </Paper>
          </Grid>
          <Grid size={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {Object.keys(filterResult.queryParams).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                保留查询参数
              </Typography>
            </Paper>
          </Grid>
          <Grid size={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {filterResult.warnings.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                警告数量
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* 警告信息 */}
      {filterResult.warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {filterResult.warnings.join('; ')}
          </Typography>
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* 详细对比 */}
      {renderDataComparison('请求头', originalContext.headers, filterResult.headers)}
      {renderDataComparison('查询参数', originalContext.queryParams, filterResult.queryParams)}
      {renderDataComparison('表单数据', originalContext.formData, filterResult.formData)}
      {renderJsonComparison(originalContext.jsonBody, filterResult.jsonBody)}
    </Box>
  );
};

export default RulePreview;
