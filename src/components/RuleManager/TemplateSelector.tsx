import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Grid,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import {
  Security as SecurityIcon,
  BugReport as BugReportIcon,
  Api as ApiIcon,
  Minimize as MinimizeIcon,
  Storage as StorageIcon,
  Check as ApplyIcon
} from '@mui/icons-material';

import type { RuleTemplate } from '../../types/filterRules';
import { FilterAction, FilterTarget } from '../../types/filterRules';

interface TemplateSelectorProps {
  templates: RuleTemplate[];
  onApply: (template: RuleTemplate) => void;
  onCancel: () => void;
}

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
      id={`template-tabpanel-${index}`}
      aria-labelledby={`template-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  onApply,
  onCancel
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<RuleTemplate | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  // 按分类分组模板
  const templatesByCategory = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, RuleTemplate[]>);

  const categories = Object.keys(templatesByCategory);

  const getCategoryIcon = (category: string) => {
    const icons = {
      security: <SecurityIcon />,
      development: <BugReportIcon />,
      testing: <ApiIcon />,
      optimization: <MinimizeIcon />,
      utility: <StorageIcon />
    };
    return icons[category as keyof typeof icons] || <StorageIcon />;
  };

  const getCategoryDisplayName = (category: string): string => {
    const names = {
      security: '安全相关',
      development: '开发调试',
      testing: 'API测试',
      optimization: '优化精简',
      utility: '实用工具'
    };
    return names[category as keyof typeof names] || category;
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

  const handleApply = () => {
    if (selectedTemplate) {
      onApply(selectedTemplate);
    }
  };

  return (
    <Box className="template-selector">
      <Alert severity="info" sx={{ mb: 2 }}>
        选择一个预设模板来快速配置过滤规则。应用模板将替换当前所有规则。
      </Alert>

      <Grid container spacing={3}>
        {/* 模板列表 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom>
            选择模板
          </Typography>

          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {categories.map((category) => (
              <Tab
                key={category}
                label={getCategoryDisplayName(category)}
                icon={getCategoryIcon(category)}
                iconPosition="start"
              />
            ))}
          </Tabs>

          {categories.map((category, index) => (
            <TabPanel key={category} value={currentTab} index={index}>
              <Grid container spacing={2}>
                {templatesByCategory[category].map((template) => (
                  <Grid size={12} key={template.id}>
                    <Card
                      variant={selectedTemplate?.id === template.id ? "outlined" : "elevation"}
                      sx={{
                        cursor: 'pointer',
                        border: selectedTemplate?.id === template.id ? 2 : 1,
                        borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider',
                        '&:hover': {
                          boxShadow: 2
                        }
                      }}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          {getCategoryIcon(template.category)}
                          <Typography variant="h6" component="h3">
                            {template.name}
                          </Typography>
                          {template.isBuiltIn && (
                            <Chip label="内置" size="small" color="primary" />
                          )}
                        </Box>

                        <Typography variant="body2" color="text.secondary" paragraph>
                          {template.description}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          包含 {template.rules.length} 个规则
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>
          ))}
        </Grid>

        {/* 模板详情 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom>
            模板详情
          </Typography>
          
          {selectedTemplate ? (
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  {getCategoryIcon(selectedTemplate.category)}
                  <Typography variant="h6">
                    {selectedTemplate.name}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedTemplate.description}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  包含的规则 ({selectedTemplate.rules.length}):
                </Typography>
                
                <List dense>
                  {selectedTemplate.rules.map((rule, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight="medium">
                              {rule.name}
                            </Typography>
                            <Chip
                              label={getActionDisplayName(rule.action)}
                              color={getActionColor(rule.action)}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={getTargetDisplayName(rule.target)}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            {rule.description && (
                              <Typography variant="caption" display="block">
                                {rule.description}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              优先级: {rule.priority}
                              {rule.matchValue && ` | 匹配值: ${rule.matchValue}`}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              
              <CardActions>
                <Button
                  variant="contained"
                  startIcon={<ApplyIcon />}
                  onClick={handleApply}
                  fullWidth
                >
                  应用此模板
                </Button>
              </CardActions>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" align="center">
                  请选择一个模板查看详情
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* 操作按钮 */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onCancel}>
          取消
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!selectedTemplate}
        >
          应用模板
        </Button>
      </Box>
    </Box>
  );
};

export default TemplateSelector;
