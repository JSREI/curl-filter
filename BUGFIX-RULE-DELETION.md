# Bug Fix: Rule Deletion Issue

## Problem Description

Rules could not be permanently deleted from the system. When a user deleted a rule through the UI, the rule would disappear temporarily but would reappear after clicking the refresh button.

## Root Cause Analysis

The issue was in the `IndexedDBStorageManager.saveRules()` method in `src/utils/indexedDBStorage.ts`. The method was using only `put()` operations to save rules, which would add or update existing rules but would not remove rules that were no longer in the provided array.

### Before Fix
```typescript
async saveRules(rules: FilterRule[]): Promise<boolean> {
  try {
    await this.executeTransaction(STORES.RULES, 'readwrite', (store) => {
      const rulesStore = store as IDBObjectStore;
      return Promise.all(rules.map(rule =>
        new Promise<void>((resolve, reject) => {
          const request = rulesStore.put(rule);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
      ));
    });
    return true;
  } catch (error) {
    console.error('批量保存规则失败:', error);
    return false;
  }
}
```

### Problem Flow
1. User deletes a rule → `handleDeleteRule` creates new array without deleted rule
2. `saveRulesToStorage(newRules)` is called with filtered array
3. `saveRules()` uses `put()` to save remaining rules
4. **Deleted rule remains in IndexedDB** because `put()` doesn't remove it
5. When refreshing, `loadRules()` loads all rules from IndexedDB, including the "deleted" one

## Solution

Modified the `saveRules()` method to first clear all existing rules before saving the new ones, ensuring the database state exactly matches the provided rule array.

### After Fix
```typescript
async saveRules(rules: FilterRule[]): Promise<boolean> {
  try {
    await this.executeTransaction(STORES.RULES, 'readwrite', (store) => {
      const rulesStore = store as IDBObjectStore;
      
      // First clear all existing rules
      const clearPromise = new Promise<void>((resolve, reject) => {
        const clearRequest = rulesStore.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      });
      
      // Wait for clear to complete, then save new rules
      return clearPromise.then(() => {
        return Promise.all(rules.map(rule =>
          new Promise<void>((resolve, reject) => {
            const request = rulesStore.put(rule);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          })
        ));
      });
    });
    return true;
  } catch (error) {
    console.error('批量保存规则失败:', error);
    return false;
  }
}
```

## Testing

### Manual Testing with Playwright
1. Created two test rules
2. Deleted one rule → Rule count changed from (2/2) to (1/1)
3. Clicked refresh button → Rule count remained (1/1), deleted rule did not reappear
4. Deleted remaining rule → Rule count changed to (0/0)
5. Clicked refresh button → No rules reappeared

### Automated Tests
Added unit tests in:
- `src/utils/__tests__/indexedDBStorage.test.ts` - Tests the fix logic
- `src/components/RuleManager/__tests__/RuleManager.test.tsx` - Tests the complete deletion flow

All tests pass successfully.

## Impact

- ✅ Rules can now be permanently deleted
- ✅ Refresh button works correctly after deletion
- ✅ No data corruption or loss
- ✅ Backward compatible with existing data
- ✅ Performance impact is minimal (clear + put operations)

## Files Modified

1. `src/utils/indexedDBStorage.ts` - Fixed the `saveRules()` method
2. `vitest.config.ts` - Added test configuration
3. `src/test/setup.ts` - Test setup file
4. `src/utils/__tests__/indexedDBStorage.test.ts` - Unit tests
5. `src/components/RuleManager/__tests__/RuleManager.test.tsx` - Integration tests
6. `package.json` - Added test scripts

## Verification

To verify the fix works:

1. Start the development server: `npm run dev`
2. Open the application and go to Rule Management
3. Create some test rules
4. Delete a rule and observe it disappears
5. Click the refresh button
6. Verify the deleted rule does not reappear

Or run the automated tests:
```bash
npm run test:run
```
