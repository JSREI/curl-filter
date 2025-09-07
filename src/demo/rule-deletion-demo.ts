/**
 * Demo script showing the difference between old and new rule deletion behavior
 * This demonstrates why the fix was necessary
 */

interface Rule {
  id: string;
  name: string;
}

// Simulate database state
let databaseRules: Rule[] = [
  { id: 'rule1', name: 'Delete User-Agent' },
  { id: 'rule2', name: 'Delete Accept-Encoding' },
  { id: 'rule3', name: 'Delete Cookie' },
];

console.log('=== Rule Deletion Behavior Demo ===\n');

console.log('Initial database state:');
console.log(databaseRules);
console.log('');

// Simulate user deleting rule2
const rulesAfterDeletion = databaseRules.filter(rule => rule.id !== 'rule2');
console.log('User deletes "Delete Accept-Encoding" rule');
console.log('Rules to save:', rulesAfterDeletion);
console.log('');

// OLD BEHAVIOR (before fix)
console.log('--- OLD BEHAVIOR (before fix) ---');
function oldSaveRules(newRules: Rule[]) {
  console.log('Using PUT operations only...');
  // Simulate put operations - only updates/adds rules, doesn't remove
  newRules.forEach(rule => {
    const existingIndex = databaseRules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      databaseRules[existingIndex] = rule; // Update
      console.log(`Updated rule: ${rule.id}`);
    } else {
      databaseRules.push(rule); // Add
      console.log(`Added rule: ${rule.id}`);
    }
  });
  // Note: Deleted rules remain in database!
}

oldSaveRules(rulesAfterDeletion);
console.log('Database state after old save method:');
console.log(databaseRules);
console.log('❌ Problem: Deleted rule still exists in database!');
console.log('');

// Reset database for new behavior demo
databaseRules = [
  { id: 'rule1', name: 'Delete User-Agent' },
  { id: 'rule2', name: 'Delete Accept-Encoding' },
  { id: 'rule3', name: 'Delete Cookie' },
];

// NEW BEHAVIOR (after fix)
console.log('--- NEW BEHAVIOR (after fix) ---');
function newSaveRules(newRules: Rule[]) {
  console.log('Step 1: Clearing all existing rules...');
  databaseRules = []; // Clear all
  console.log('Database cleared');
  
  console.log('Step 2: Adding new rules...');
  newRules.forEach(rule => {
    databaseRules.push(rule);
    console.log(`Added rule: ${rule.id}`);
  });
}

newSaveRules(rulesAfterDeletion);
console.log('Database state after new save method:');
console.log(databaseRules);
console.log('✅ Success: Database exactly matches the provided rules!');
console.log('');

// Simulate refresh behavior
console.log('--- REFRESH BEHAVIOR ---');
console.log('When user clicks refresh, loadRules() returns:');
console.log('Old behavior would return:', [
  { id: 'rule1', name: 'Delete User-Agent' },
  { id: 'rule2', name: 'Delete Accept-Encoding' }, // ❌ Deleted rule reappears!
  { id: 'rule3', name: 'Delete Cookie' },
]);
console.log('New behavior returns:', databaseRules); // ✅ Only remaining rules
console.log('');

console.log('=== Summary ===');
console.log('✅ Fix ensures database state matches UI state');
console.log('✅ Deleted rules stay deleted after refresh');
console.log('✅ No phantom rules reappearing');
