import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Switch,
  Chip,
  Typography,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';

import type { FilterRule } from '../../types/filterRules';
import { FilterAction, FilterTarget, MatchMode } from '../../types/filterRules';

interface RuleListProps {
  rules: FilterRule[];
  onEdit: (rule: FilterRule) => void;
  onDelete: (ruleId: string) => void;
  onToggle: (ruleId: string) => void;
}

const RuleList: React.FC<RuleListProps> = ({
  rules,
  onEdit,
  onDelete,
  onToggle
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedRule, setSelectedRule] = React.useState<FilterRule | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, rule: FilterRule) => {
    setAnchorEl(event.currentTarget);
    setSelectedRule(rule);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRule(null);
  };

  const handleEdit = () => {
    if (selectedRule) {
      onEdit(selectedRule);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedRule) {
      onDelete(selectedRule.id);
    }
    handleMenuClose();
  };

  const getActionDisplayName = (action: FilterAction): string => {
    const names = {
      [FilterAction.DELETE]: '删除',
      [FilterAction.DELETE_ALL]: '删除全部',
      [FilterAction.KEEP]: '保留',
      [FilterAction.KEEP_ALL]: '保留全部'
    };
    return names[action];
  };

  const getTargetDisplayName = (target: FilterTarget): string => {
    const names = {
      [FilterTarget.HEADERS]: '请求头',
      [FilterTarget.QUERY_PARAMS]: '查询参数',
      [FilterTarget.FORM_DATA]: '表单数据',
      [FilterTarget.JSON_BODY]: 'JSON请求体'
    };
    return names[target];
  };

  const getMatchModeDisplayName = (mode: MatchMode): string => {
    const names = {
      [MatchMode.EXACT]: '精确匹配',
      [MatchMode.CONTAINS]: '包含',
      [MatchMode.REGEX]: '正则表达式',
      [MatchMode.STARTS_WITH]: '开头匹配',
      [MatchMode.ENDS_WITH]: '结尾匹配'
    };
    return names[mode];
  };

  const getActionColor = (action: FilterAction): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (action) {
      case FilterAction.DELETE:
      case FilterAction.DELETE_ALL:
        return 'error';
      case FilterAction.KEEP:
      case FilterAction.KEEP_ALL:
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: number): string => {
    if (priority >= 80) return '#f44336'; // 高优先级 - 红色
    if (priority >= 60) return '#ff9800'; // 中高优先级 - 橙色
    if (priority >= 40) return '#2196f3'; // 中等优先级 - 蓝色
    return '#4caf50'; // 低优先级 - 绿色
  };

  if (rules.length === 0) {
    return (
      <Box className="rule-list-empty">
        <Typography variant="body1" color="text.secondary" align="center">
          暂无规则，点击"添加规则"开始创建过滤规则
        </Typography>
      </Box>
    );
  }

  // 按优先级排序显示
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  return (
    <Box className="rule-list">
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width="40px"></TableCell>
              <TableCell width="60px">状态</TableCell>
              <TableCell>规则名称</TableCell>
              <TableCell width="80px">动作</TableCell>
              <TableCell width="100px">目标</TableCell>
              <TableCell width="100px">匹配模式</TableCell>
              <TableCell>匹配值</TableCell>
              <TableCell width="80px">优先级</TableCell>
              <TableCell width="100px">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRules.map((rule) => (
              <TableRow
                key={rule.id}
                hover
                sx={{
                  opacity: rule.enabled ? 1 : 0.6,
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <TableCell>
                  <DragIcon color="disabled" fontSize="small" />
                </TableCell>
                
                <TableCell>
                  <Switch
                    checked={rule.enabled}
                    onChange={() => onToggle(rule.id)}
                    size="small"
                    color="primary"
                  />
                </TableCell>
                
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {rule.name}
                    </Typography>
                    {rule.description && (
                      <Typography variant="caption" color="text.secondary">
                        {rule.description}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Chip
                    label={getActionDisplayName(rule.action)}
                    color={getActionColor(rule.action)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {getTargetDisplayName(rule.target)}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {getMatchModeDisplayName(rule.matchMode)}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: '150px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {rule.matchValue || '-'}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Chip
                    label={rule.priority}
                    size="small"
                    sx={{
                      backgroundColor: getPriorityColor(rule.priority),
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </TableCell>
                
                <TableCell>
                  <Box className="rule-actions">
                    <Tooltip title="编辑规则">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(rule)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="更多操作">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, rule)}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 操作菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          编辑规则
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          删除规则
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default RuleList;
