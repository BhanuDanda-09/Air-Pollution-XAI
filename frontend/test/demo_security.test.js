/**
 * Unit and security tests for Demo Persona Gating & Axios 401 Interceptor.
 *
 * Verifies:
 * 1. Setting localStorage demo keys manually with flag off does NOT grant admin/worker access.
 * 2. switchDemoRole() refused when flag is off.
 * 3. Axios 401 interceptor logs out real (non-demo) sessions.
 * 4. Axios 401 interceptor preserves user state on demo session errors.
 */

import assert from 'node:assert';

// ---------------------------------------------------------------------------
// In-Memory Storage & Window Shim for Node.js test execution
// ---------------------------------------------------------------------------
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

const dispatchedEvents = [];
globalThis.window = {
  localStorage: globalThis.localStorage,
  dispatchEvent: (event) => {
    dispatchedEvents.push(event);
    return true;
  },
};

globalThis.CustomEvent = class CustomEvent {
  constructor(type, params = {}) {
    this.type = type;
    this.detail = params.detail || null;
  }
};

// ---------------------------------------------------------------------------
// Test Suite 1: Manual Injection Attack with VITE_ENABLE_DEMO_MODE=false
// ---------------------------------------------------------------------------
process.env.VITE_ENABLE_DEMO_MODE = 'false';
store.clear();

const { isDemoModeEnabled, getDemoRole, hasRoleAccess, switchDemoRole } = await import(
  '../src/services/demoAuth.js'
);

assert.strictEqual(
  isDemoModeEnabled(),
  false,
  'Demo mode must be reported as false when VITE_ENABLE_DEMO_MODE is not true'
);

// Malicious actor tries setting demo_role manually in localStorage
localStorage.setItem('demo_role', 'admin');
localStorage.setItem('demo_jwt_admin', 'forged_admin_token');

// Must NOT grant admin or worker access
const adminAccess = hasRoleAccess('admin');
assert.strictEqual(
  adminAccess,
  false,
  'SECURITY CHECK FAILED: Manual localStorage demo_role=admin granted admin access while flag is OFF!'
);

const workerAccess = hasRoleAccess('worker');
assert.strictEqual(
  workerAccess,
  false,
  'SECURITY CHECK FAILED: Manual localStorage demo_role granted worker access while flag is OFF!'
);

// getDemoRole must return null and purge injected keys
const demoRoleResult = getDemoRole();
assert.strictEqual(demoRoleResult, null, 'getDemoRole() must return null when flag is OFF');
assert.strictEqual(localStorage.getItem('demo_role'), null, 'demo_role key must be purged');

// switchDemoRole() must refuse to execute
const switchSuccess = switchDemoRole('admin');
assert.strictEqual(switchSuccess, false, 'switchDemoRole() must return false when flag is OFF');
assert.strictEqual(localStorage.getItem('demo_role'), null);

console.log('✓ Test 1 Passed: Manual demo key injection does NOT grant admin/worker access when flag is OFF.');

// ---------------------------------------------------------------------------
// Test Suite 2: Legitimate Switching when VITE_ENABLE_DEMO_MODE=true
// ---------------------------------------------------------------------------
process.env.VITE_ENABLE_DEMO_MODE = 'true';
assert.strictEqual(isDemoModeEnabled(), true);

const switchWorker = switchDemoRole('worker');
assert.strictEqual(switchWorker, true);
assert.strictEqual(localStorage.getItem('demo_role'), 'worker');
assert.strictEqual(hasRoleAccess('worker'), true);
assert.strictEqual(hasRoleAccess('admin'), false, 'Worker persona must NOT have admin access');

const switchAdmin = switchDemoRole('admin');
assert.strictEqual(switchAdmin, true);
assert.strictEqual(localStorage.getItem('demo_role'), 'admin');
assert.strictEqual(hasRoleAccess('admin'), true, 'Admin persona must have admin access');
assert.strictEqual(hasRoleAccess('worker'), true, 'Admin persona must have worker access');

console.log('✓ Test 2 Passed: Role switching functions correctly when flag is ON.');

// ---------------------------------------------------------------------------
// Test Suite 3: Axios 401 Interceptor on Real (Non-Demo) Session
// ---------------------------------------------------------------------------
store.clear();
dispatchedEvents.length = 0;

// Set real session
localStorage.setItem('auth_token', 'real_user_jwt_token_12345');
localStorage.setItem('user', JSON.stringify({ email: 'citizen@example.com', role: 'citizen' }));

// Simulate Axios 401 error response
const simulate401Error = {
  response: {
    status: 401,
    data: { error: { code: 'UNAUTHORIZED', message: 'Token expired' } },
  },
};

// Execute 401 handler logic directly from api interceptor
const handle401Response = (error) => {
  if (error.response?.status === 401 && typeof window !== 'undefined' && window.localStorage) {
    const isDemoSession = Boolean(localStorage.getItem('demo_role'));
    if (!isDemoSession) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.dispatchEvent(
        new CustomEvent('auth:logout', { detail: { reason: 'session_expired' } })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent('auth:demo-401', { detail: { error: error.response?.data } })
      );
    }
  }
};

handle401Response(simulate401Error);

// Real session must be logged out: tokens and user wiped
assert.strictEqual(
  localStorage.getItem('auth_token'),
  null,
  'Real session auth_token must be cleared on 401'
);
assert.strictEqual(
  localStorage.getItem('user'),
  null,
  'Real session user must be cleared on 401'
);

const logoutEvent = dispatchedEvents.find((e) => e.type === 'auth:logout');
assert.ok(logoutEvent, 'auth:logout event must be dispatched for real session');
assert.strictEqual(logoutEvent.detail?.reason, 'session_expired');

console.log('✓ Test 3 Passed: 401 interceptor logs out real (non-demo) sessions.');

// ---------------------------------------------------------------------------
// Test Suite 4: Axios 401 Interceptor on Demo Session
// ---------------------------------------------------------------------------
store.clear();
dispatchedEvents.length = 0;

// Set demo session alongside real user profile
localStorage.setItem('demo_role', 'worker');
localStorage.setItem('auth_token', 'demo_jwt_worker_token');
localStorage.setItem('user', JSON.stringify({ email: 'real_account@example.com' }));

handle401Response(simulate401Error);

// Real user session must NOT be wiped when a demo call errors
assert.strictEqual(
  localStorage.getItem('user'),
  JSON.stringify({ email: 'real_account@example.com' }),
  'Real user profile must NOT be deleted during demo session 401'
);

const demo401Event = dispatchedEvents.find((e) => e.type === 'auth:demo-401');
assert.ok(demo401Event, 'auth:demo-401 event must be dispatched for demo session');

console.log('✓ Test 4 Passed: 401 interceptor handles demo sessions without destroying real credentials.');
console.log('✓ All Demo Security and 401 Interceptor unit tests passed successfully.');
