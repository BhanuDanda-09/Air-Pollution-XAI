import assert from 'node:assert';
import authService from '../src/services/authService.js';

console.log('Running authService and session persistence unit tests...');

// Mock localStorage in Node.js test environment
const mockStorage = {};
global.window = {
  localStorage: {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, val) => {
      mockStorage[key] = String(val);
    },
    removeItem: (key) => {
      delete mockStorage[key];
    },
    clear: () => {
      Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    },
  },
};
global.localStorage = global.window.localStorage;

// 1. Initial unauthenticated state
assert.strictEqual(authService.isAuthenticated(), false, 'Initial state should not be authenticated');
assert.strictEqual(authService.getToken(), null);
assert.strictEqual(authService.getStoredUser(), null);

// 2. Set user session
const testUser = { id: 42, email: 'user@example.com', name: 'Citizen' };
const testToken = 'mock_jwt_access_token_123';
const testRefresh = 'mock_jwt_refresh_token_456';

authService.setSession(testUser, testToken, testRefresh);
assert.strictEqual(authService.getToken(), testToken, 'Token should match stored value');
assert.strictEqual(authService.getRefreshToken(), testRefresh, 'Refresh token should match stored value');
assert.deepStrictEqual(authService.getStoredUser(), testUser, 'User object should be deserialized');
assert.strictEqual(authService.isAuthenticated(), true, 'Should be authenticated after setting session');

// 3. Demo role priority check: if demo_role is set, isAuthenticated() returns false
global.localStorage.setItem('demo_role', 'admin');
assert.strictEqual(
  authService.isAuthenticated(),
  false,
  'Demo session must not be flagged as genuine authenticated citizen account'
);
global.localStorage.removeItem('demo_role');
assert.strictEqual(authService.isAuthenticated(), true, 'Clearing demo_role restores genuine session status');

// 4. Clear session
authService.clearSession();
assert.strictEqual(authService.getToken(), null, 'Token should be removed');
assert.strictEqual(authService.getRefreshToken(), null, 'Refresh token should be removed');
assert.strictEqual(authService.getStoredUser(), null, 'User object should be removed');
assert.strictEqual(authService.isAuthenticated(), false, 'Should be unauthenticated after clearing session');

console.log('✓ All authService and session persistence unit tests passed successfully.');
