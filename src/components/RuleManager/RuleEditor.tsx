import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Button,
  FormControlLabel,
  Switch,
  Alert,
  Divider,
  Grid
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

import type { FilterRule } from '../../types/filterRules';
import {
  FilterAction,
  FilterTarget,
  MatchMode,
  PRIORITY_RANGE
} from '../../types/filterRules';
import { validateRule, updateRuleTimestamp } from '../../utils/ruleValidation';

interface RuleEditorProps {
  rule: FilterRule;
  onSave: (rule: FilterRule) => void;
  onCancel: () => void;
}

const RuleEditor: React.FC<RuleEditorProps> = ({
  rule,
  onSave,
  onCancel
}) => {
  const [editedRule, setEditedRule] = useState<FilterRule>(rule);
  const [validation, setValidation] = useState(validateRule(rule));

  // 当规则改变时重新验证
  useEffect(() => {
    const newValidation = validateRule(editedRule);
    setValidation(newValidation);
  }, [editedRule]);

  const handleFieldChange = (field: keyof FilterRule, value: any) => {
    setEditedRule(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (validation.isValid) {
      const updatedRule = updateRuleTimestamp(editedRule);
      onSave(updatedRule);
    }
  };

  const needsMatchValue = editedRule.action === FilterAction.DELETE || editedRule.action === FilterAction.KEEP;

  const getActionDescription = (action: FilterAction): string => {
    const descriptions = {
      [FilterAction.DELETE]: '删除匹配的项目',
      [FilterAction.DELETE_ALL]: '删除所有项目（忽略匹配值）',
      [FilterAction.KEEP]: '保留匹配的项目',
      [FilterAction.KEEP_ALL]: '保留所有项目（忽略匹配值）'
    };
    return descriptions[action];
  };

  const getTargetDescription = (target: FilterTarget): string => {
    const descriptions = {
      [FilterTarget.HEADERS]: 'HTTP请求头字段',
      [FilterTarget.QUERY_PARAMS]: 'URL查询参数',
      [FilterTarget.FORM_DATA]: '表单数据字段',
      [FilterTarget.JSON_BODY]: 'JSON请求体字段'
    };
    return descriptions[target];
  };

  const getMatchModeDescription = (mode: MatchMode): string => {
    const descriptions = {
      [MatchMode.EXACT]: '完全匹配字段名',
      [MatchMode.CONTAINS]: '字段名包含指定文本',
      [MatchMode.REGEX]: '使用正则表达式匹配',
      [MatchMode.STARTS_WITH]: '字段名以指定文本开头',
      [MatchMode.ENDS_WITH]: '字段名以指定文本结尾'
    };
    return descriptions[mode];
  };

  const getPriorityDescription = (priority: number): string => {
    if (priority >= 80) return '高优先级 - 最先执行';
    if (priority >= 60) return '中高优先级';
    if (priority >= 40) return '中等优先级';
    return '低优先级 - 最后执行';
  };

  return (
    <Box className="rule-editor">
      {/* 验证错误提示 */}
      {validation.errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {validation.errors.join(', ')}
          </Typography>
        </Alert>
      )}

      {/* 验证警告提示 */}
      {validation.warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {validation.warnings.join(', ')}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 基本信息 */}
        <Grid size={12}>
          <Typography variant="h6" gutterBottom>
            基本信息
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField
            fullWidth
            label="规则名称"
            value={editedRule.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            error={!editedRule.name.trim()}
            helperText={!editedRule.name.trim() ? '规则名称不能为空' : ''}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControlLabel
            control={
              <Switch
                checked={editedRule.enabled}
                onChange={(e) => handleFieldChange('enabled', e.target.checked)}
              />
            }
            label="启用规则"
          />
        </Grid>

        <Grid size={12}>
          <TextField
            fullWidth
            label="规则描述"
            value={editedRule.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            multiline
            rows={2}
            helperText="可选：描述此规则的用途"
          />
        </Grid>

        <Grid size={12}>
          <Divider />
        </Grid>

        {/* 过滤配置 */}
        <Grid size={12}>
          <Typography variant="h6" gutterBottom>
            过滤配置
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth required>
            <InputLabel>过滤动作</InputLabel>
            <Select
              value={editedRule.action}
              onChange={(e) => handleFieldChange('action', e.target.value)}
              label="过滤动作"
            >
              <MenuItem value={FilterAction.DELETE}>删除</MenuItem>
              <MenuItem value={FilterAction.DELETE_ALL}>删除全部</MenuItem>
              <MenuItem value={FilterAction.KEEP}>保留</MenuItem>
              <MenuItem value={FilterAction.KEEP_ALL}>保留全部</MenuItem>
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {getActionDescription(editedRule.action)}
            </Typography>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth required>
            <InputLabel>过滤目标</InputLabel>
            <Select
              value={editedRule.target}
              onChange={(e) => handleFieldChange('target', e.target.value)}
              label="过滤目标"
            >
              <MenuItem value={FilterTarget.HEADERS}>请求头</MenuItem>
              <MenuItem value={FilterTarget.QUERY_PARAMS}>查询参数</MenuItem>
              <MenuItem value={FilterTarget.FORM_DATA}>表单数据</MenuItem>
              <MenuItem value={FilterTarget.JSON_BODY}>JSON请求体</MenuItem>
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {getTargetDescription(editedRule.target)}
            </Typography>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth required>
            <InputLabel>匹配模式</InputLabel>
            <Select
              value={editedRule.matchMode}
              onChange={(e) => handleFieldChange('matchMode', e.target.value)}
              label="匹配模式"
            >
              <MenuItem value={MatchMode.EXACT}>精确匹配</MenuItem>
              <MenuItem value={MatchMode.CONTAINS}>包含匹配</MenuItem>
              <MenuItem value={MatchMode.STARTS_WITH}>开头匹配</MenuItem>
              <MenuItem value={MatchMode.ENDS_WITH}>结尾匹配</MenuItem>
              <MenuItem value={MatchMode.REGEX}>正则表达式</MenuItem>
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {getMatchModeDescription(editedRule.matchMode)}
            </Typography>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="匹配值"
            value={editedRule.matchValue}
            onChange={(e) => handleFieldChange('matchValue', e.target.value)}
            disabled={!needsMatchValue}
            required={needsMatchValue}
            error={needsMatchValue && !editedRule.matchValue.trim()}
            helperText={
              !needsMatchValue
                ? '当前动作不需要匹配值'
                : needsMatchValue && !editedRule.matchValue.trim()
                ? '该动作需要指定匹配值'
                : editedRule.matchMode === MatchMode.REGEX
                ? '请输入有效的正则表达式'
                : '要匹配的字段名或模式'
            }
          />
        </Grid>

        <Grid size={12}>
          <Divider />
        </Grid>

        {/* 优先级设置 */}
        <Grid size={12}>
          <Typography variant="h6" gutterBottom>
            优先级设置
          </Typography>
        </Grid>

        <Grid size={12}>
          <Box sx={{ px: 2 }}>
            <Typography gutterBottom>
              优先级: {editedRule.priority}
            </Typography>
            <Slider
              value={editedRule.priority}
              onChange={(_, value) => handleFieldChange('priority', value)}
              min={PRIORITY_RANGE.MIN}
              max={PRIORITY_RANGE.MAX}
              step={1}
              marks={[
                { value: 0, label: '0' },
                { value: 25, label: '25' },
                { value: 50, label: '50' },
                { value: 75, label: '75' },
                { value: 100, label: '100' }
              ]}
              valueLabelDisplay="auto"
            />
            <Typography variant="caption" color="text.secondary">
              {getPriorityDescription(editedRule.priority)}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* 操作按钮 */}
      <Box className="rule-editor-actions" sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={onCancel}
        >
          取消
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!validation.isValid}
        >
          保存规则
        </Button>
      </Box>
    </Box>
  );
};

export default RuleEditor;
