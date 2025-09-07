# API Documentation

This document describes the core APIs and interfaces used in the cURL Filter application.

## 🔧 Core APIs

### CurlParser

Parses cURL commands into structured data.

```typescript
import { parseCurl, type ParsedCurl } from './utils/curlParser';

// Parse a cURL command
const result: ParsedCurl = parseCurl(curlCommand);
```

#### ParsedCurl Interface

```typescript
interface ParsedCurl {
  url: string;                    // Request URL
  method: string;                 // HTTP method (GET, POST, etc.)
  headers: Record<string, string>; // HTTP headers
  queryParams: Record<string, string>; // URL query parameters
  formData: Record<string, string>;    // Form data
  jsonBody: any;                  // JSON request body
  data?: string;                  // Raw data (for backward compatibility)
  otherOptions: string[];         // Other cURL options
}
```

#### Example Usage

```typescript
const curlCommand = `curl 'https://api.example.com/users' \\
  -H 'authorization: Bearer token123' \\
  -H 'content-type: application/json' \\
  -d '{"name": "John"}'`;

const parsed = parseCurl(curlCommand);
console.log(parsed.url);        // 'https://api.example.com/users'
console.log(parsed.method);     // 'GET'
console.log(parsed.headers);    // { authorization: 'Bearer token123', ... }
console.log(parsed.jsonBody);   // { name: 'John' }
```

### FilterEngine

Applies filtering rules to parsed cURL data.

```typescript
import { FilterEngine } from './utils/filterEngine';
import type { FilterRule, FilterContext, FilterResult } from './types/filterRules';

// Create filter engine
const engine = new FilterEngine();

// Set rules
engine.setRules(rules);

// Apply filters
const result: FilterResult = engine.applyFilters(context);
```

#### FilterRule Interface

```typescript
interface FilterRule {
  id: string;                    // Unique identifier
  name: string;                  // Rule name
  action: FilterAction;          // Filter action
  target: FilterTarget;          // Target type
  matchMode: MatchMode;          // Match pattern
  matchValue: string;            // Match value
  priority: number;              // Priority (0-100)
  enabled: boolean;              // Whether rule is enabled
  description?: string;          // Optional description
  createdAt: string;            // Creation timestamp
  updatedAt: string;            // Last update timestamp
}
```

#### FilterAction Types

```typescript
type FilterAction = 'delete' | 'delete_all' | 'keep' | 'keep_all';
```

- `delete`: Remove matching items
- `delete_all`: Remove all items (ignore match value)
- `keep`: Keep only matching items
- `keep_all`: Keep all items (ignore match value)

#### FilterTarget Types

```typescript
type FilterTarget = 'headers' | 'query_params' | 'form_data' | 'json_body';
```

#### MatchMode Types

```typescript
type MatchMode = 'exact' | 'contains' | 'starts_with' | 'ends_with' | 'regex';
```

#### FilterContext Interface

```typescript
interface FilterContext {
  headers: Record<string, string>;     // HTTP headers
  queryParams: Record<string, string>; // Query parameters
  formData: Record<string, string>;    // Form data
  jsonBody: any;                       // JSON body
  url: string;                         // Request URL
  method: string;                      // HTTP method
}
```

#### FilterResult Interface

```typescript
interface FilterResult {
  headers: Record<string, string>;     // Filtered headers
  queryParams: Record<string, string>; // Filtered query parameters
  formData: Record<string, string>;    // Filtered form data
  jsonBody: any;                       // Filtered JSON body
  appliedRules: string[];              // Applied rule IDs
  warnings: string[];                  // Warning messages
}
```

### RuleValidation

Validates filter rules and provides error feedback.

```typescript
import { validateRule, validateRuleField } from './utils/ruleValidation';

// Validate complete rule
const validation = validateRule(rule);
if (!validation.isValid) {
  console.log('Errors:', validation.errors);
  console.log('Warnings:', validation.warnings);
}

// Validate specific field
const fieldErrors = validateRuleField('matchValue', value, rule);
```

#### RuleValidationResult Interface

```typescript
interface RuleValidationResult {
  isValid: boolean;      // Whether rule is valid
  errors: string[];      // Error messages
  warnings: string[];    // Warning messages
}
```

### Storage APIs

#### Rule Storage

```typescript
import { saveRules, loadRules } from './utils/ruleStorage';

// Save rules
const success = await saveRules(rules);

// Load rules
const rules = await loadRules();
```

#### History Storage

```typescript
import { 
  saveHistoryEntry, 
  getHistoryEntries, 
  deleteHistoryEntry 
} from './utils/indexedDBStorage';

// Save history entry
await saveHistoryEntry(inputCurl, outputCurl, appliedRules, filterResult);

// Get history entries
const entries = await getHistoryEntries({
  limit: 10,
  offset: 0,
  sortBy: 'timestamp',
  sortOrder: 'desc'
});

// Delete history entry
await deleteHistoryEntry(entryId);
```

## 🎨 Component APIs

### CurlFilter Component

Main application component with the following props:

```typescript
interface CurlFilterProps {
  // No props - self-contained component
}
```

### RuleManager Component

```typescript
interface RuleManagerProps {
  open: boolean;                           // Whether dialog is open
  onClose: () => void;                    // Close handler
  rules: FilterRule[];                    // Current rules
  onRulesChange: (rules: FilterRule[]) => void; // Rules change handler
}
```

### HistoryManager Component

```typescript
interface HistoryManagerProps {
  open: boolean;                          // Whether dialog is open
  onClose: () => void;                   // Close handler
  onSelectEntry?: (entry: HistoryEntry) => void; // Entry selection handler
}
```

## 🌐 Internationalization API

### Translation Hook

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();
  
  // Simple translation
  const title = t('app.title');
  
  // Translation with parameters
  const message = t('messages.filterComplete', { count: 5 });
  
  // Change language
  i18n.changeLanguage('zh');
  
  return <div>{title}</div>;
}
```

### Translation Keys Structure

```typescript
interface TranslationKeys {
  app: {
    title: string;
    subtitle: string;
  };
  buttons: {
    save: string;
    cancel: string;
    // ... more buttons
  };
  messages: {
    success: string;
    error: string;
    // ... more messages
  };
  // ... more sections
}
```

## 🔍 Utility Functions

### Rule Templates

```typescript
import { BUILT_IN_TEMPLATES, createRuleFromTemplate } from './utils/ruleTemplates';

// Get available templates
const templates = BUILT_IN_TEMPLATES;

// Create rules from template
const rules = createRuleFromTemplate(template);
```

### Rule Generation

```typescript
import { generateRuleId, createDefaultRule } from './utils/ruleValidation';

// Generate unique rule ID
const id = generateRuleId();

// Create default rule
const rule = createDefaultRule({
  name: 'My Custom Rule',
  action: 'delete',
  target: 'headers'
});
```

## 🚨 Error Handling

### Common Error Types

```typescript
// Parse errors
try {
  const parsed = parseCurl(invalidCurl);
} catch (error) {
  console.error('Parse error:', error.message);
}

// Validation errors
const validation = validateRule(rule);
if (!validation.isValid) {
  validation.errors.forEach(error => {
    console.error('Validation error:', error);
  });
}

// Storage errors
try {
  await saveRules(rules);
} catch (error) {
  console.error('Storage error:', error);
}
```

### Error Recovery

The application implements graceful error recovery:

1. **Parse Errors**: Show user-friendly error messages
2. **Validation Errors**: Highlight problematic fields
3. **Storage Errors**: Fallback to memory storage
4. **Network Errors**: Retry mechanisms where applicable

## 📊 Performance Considerations

### Debouncing

Input processing is debounced to improve performance:

```typescript
// Auto-filter with 800ms debounce
const autoFilter = useCallback(debounce((curlText: string) => {
  // Process input
}, 800), []);
```

### Memoization

Expensive computations are memoized:

```typescript
const processedRules = useMemo(() => {
  return rules.filter(rule => rule.enabled)
              .sort((a, b) => b.priority - a.priority);
}, [rules]);
```

### Virtual Scrolling

Large lists use virtual scrolling for better performance:

```typescript
// History entries are virtualized for large datasets
const VirtualizedHistoryList = ({ entries }) => {
  // Implementation details...
};
```
