import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import type { FilterRule, RuleTemplate } from '../../types/filterRules';
import { storageManager, saveRules, loadRules } from '../../utils/ruleStorage';
import { validateRules } from '../../utils/ruleValidation';
import { BUILT_IN_TEMPLATES } from '../../utils/ruleTemplates';
import { createDefaultRule } from '../../utils/ruleValidation';
import { useTranslation } from 'react-i18next';

import RuleList from './RuleList';
import RuleEditor from './RuleEditor';
import TemplateSelector from './TemplateSelector';
import './RuleManager.css';

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
      id={`rule-tabpanel-${index}`}
      aria-labelledby={`rule-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface RuleManagerProps {
  onRulesChange?: (rules: FilterRule[]) => void;
}

const RuleManager: React.FC<RuleManagerProps> = ({ onRulesChange }) => {
  const { t } = useTranslation();
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<FilterRule | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // 加载规则
  const loadRulesFromStorage = useCallback(async () => {
    try {
      const loadedRules = await loadRules();
      setRules(loadedRules);
      onRulesChange?.(loadedRules);
    } catch (error) {
      showNotification(t('messages.loadFailed'), 'error');
    }
  }, [onRulesChange, t]);

  // 保存规则
  const saveRulesToStorage = useCallback(async (newRules: FilterRule[]) => {
    try {
      const success = await saveRules(newRules);
      if (success) {
        setRules(newRules);
        onRulesChange?.(newRules);
        showNotification(t('messages.saveSuccess'), 'success');
      } else {
        showNotification(t('messages.saveFailed'), 'error');
      }
    } catch (error) {
      showNotification(t('messages.saveFailed'), 'error');
    }
  }, [onRulesChange, t]);

  // 显示通知
  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  };

  // 初始化加载
  useEffect(() => {
    loadRulesFromStorage();
  }, [loadRulesFromStorage]);

  // 添加新规则
  const handleAddRule = () => {
    const newRule = createDefaultRule();
    setSelectedRule(newRule);
    setIsEditorOpen(true);
  };

  // 编辑规则
  const handleEditRule = (rule: FilterRule) => {
    setSelectedRule(rule);
    setIsEditorOpen(true);
  };

  // 删除规则
  const handleDeleteRule = (ruleId: string) => {
    const newRules = rules.filter(rule => rule.id !== ruleId);
    saveRulesToStorage(newRules);
  };

  // 切换规则启用状态
  const handleToggleRule = (ruleId: string) => {
    const newRules = rules.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    );
    saveRulesToStorage(newRules);
  };

  // 保存规则编辑
  const handleSaveRule = (rule: FilterRule) => {
    const existingIndex = rules.findIndex(r => r.id === rule.id);
    let newRules: FilterRule[];

    if (existingIndex >= 0) {
      // 更新现有规则
      newRules = rules.map(r => r.id === rule.id ? rule : r);
    } else {
      // 添加新规则
      newRules = [...rules, rule];
    }

    // 验证规则
    const validation = validateRules(newRules);
    if (!validation.isValid) {
      showNotification(`规则验证失败: ${validation.errors.join(', ')}`, 'error');
      return;
    }

    if (validation.warnings.length > 0) {
      showNotification(`警告: ${validation.warnings.join(', ')}`, 'warning');
    }

    saveRulesToStorage(newRules);
    setIsEditorOpen(false);
    setSelectedRule(null);
  };

  // 应用模板
  const handleApplyTemplate = (template: RuleTemplate) => {
    const now = new Date().toISOString();
    const templateRules: FilterRule[] = template.rules.map((rule, index) => ({
      ...rule,
      id: `template_${template.id}_${Date.now()}_${index}`,
      createdAt: now,
      updatedAt: now
    }));

    saveRulesToStorage(templateRules);
    setIsTemplateDialogOpen(false);
    showNotification(`已应用模板: ${template.name}`, 'success');
  };

  // 导出配置
  const handleExport = async () => {
    try {
      const config = await storageManager.loadConfig();
      if (!config) {
        showNotification('没有可导出的配置', 'warning');
        return;
      }

      const exportData = await storageManager.exportConfig();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cURL-filter-rules-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNotification('配置导出成功', 'success');
    } catch (error) {
      showNotification('配置导出失败', 'error');
    }
  };

  // 导入配置
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const result = await storageManager.importConfig(content);

          if (result.success && result.config) {
            const success = await storageManager.saveConfig(result.config);
            if (success) {
              await loadRulesFromStorage();
              showNotification(t('messages.configImportSuccess'), 'success');
            } else {
              showNotification(t('messages.configSaveFailed'), 'error');
            }
          } else {
            showNotification(result.error || t('messages.configImportFailed'), 'error');
          }
        } catch (error) {
          showNotification(t('messages.fileReadFailed'), 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <Box className="rule-manager">
      <Paper elevation={2} className="rule-manager-paper">
        <Box className="rule-manager-header">
          <Typography variant="h5" component="h2" className="rule-manager-title">
            <SettingsIcon className="title-icon" />
            {t('dialogs.filterRuleManagement')}
          </Typography>

          <Box className="rule-manager-actions">
            <Tooltip title={t('buttons.refresh', { defaultValue: '刷新规则' })}>
              <IconButton onClick={loadRulesFromStorage} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('buttons.import')}>
              <IconButton onClick={handleImport} size="small">
                <UploadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('buttons.export')}>
              <IconButton onClick={handleExport} size="small">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddRule}
              size="small"
            >
              {t('buttons.add')}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setIsTemplateDialogOpen(true)}
              size="small"
            >
              {t('buttons.applyTemplate', { defaultValue: '应用模板' })}
            </Button>
          </Box>
        </Box>

        <Divider />

        <Box className="rule-manager-content">
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab label={`${t('tabs.ruleList')} (${rules.length})`} />
            <Tab label={t('tabs.ruleStatistics', { defaultValue: '规则统计' })} />
          </Tabs>

          <TabPanel value={currentTab} index={0}>
            <RuleList
              rules={rules}
              onEdit={handleEditRule}
              onDelete={handleDeleteRule}
              onToggle={handleToggleRule}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <Box className="rule-stats">
              <Typography variant="h6">{t('tabs.ruleStatistics', { defaultValue: '规则统计' })}</Typography>
              <Typography>{t('rules.totalRules', { total: rules.length })}</Typography>
              <Typography>{t('rules.enabled', { count: rules.filter(r => r.enabled).length })}</Typography>
              <Typography>{t('rules.disabled', { count: rules.filter(r => !r.enabled).length })}</Typography>
            </Box>
          </TabPanel>
        </Box>
      </Paper>

      {/* 规则编辑对话框 */}
      <Dialog
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedRule && rules.find(r => r.id === selectedRule.id) ? t('buttons.edit') + t('rules.name', { defaultValue: '规则' }) : t('buttons.add') + t('rules.name', { defaultValue: '规则' })}
        </DialogTitle>
        <DialogContent>
          {selectedRule && (
            <RuleEditor
              rule={selectedRule}
              onSave={handleSaveRule}
              onCancel={() => setIsEditorOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 模板选择对话框 */}
      <Dialog
        open={isTemplateDialogOpen}
        onClose={() => setIsTemplateDialogOpen(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>{t('templates.selectTemplate', { defaultValue: '选择规则模板' })}</DialogTitle>
        <DialogContent>
          <TemplateSelector
            templates={BUILT_IN_TEMPLATES}
            onApply={handleApplyTemplate}
            onCancel={() => setIsTemplateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 通知 */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RuleManager;
