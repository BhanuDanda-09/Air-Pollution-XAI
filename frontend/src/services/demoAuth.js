/**
 * Demo persona management and role-based access control.
 *
 * HARD CONSTRAINT:
 * All demo personas, tokens, role-switching and mock-store features are strictly
 * gated behind VITE_ENABLE_DEMO_MODE. When false, none of it executes or renders.
 */

export const DEMO_ROLES = {
  CITIZEN: 'citizen',
  WORKER: 'worker',
  ADMIN: 'admin',
};

/**
 * Check whether demo mode is enabled in the environment.
 * @returns {boolean} True only if VITE_ENABLE_DEMO_MODE is explicitly 'true'
 */
export const isDemoModeEnabled = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env.VITE_ENABLE_DEMO_MODE === 'true';
  }
  return false;
};

/**
 * Retrieve the active demo role if demo mode is enabled.
 * If demo mode is disabled, purges any lingering demo keys and returns null.
 * @returns {string|null} Active demo role ('citizen', 'worker', 'admin') or null
 */
export const getDemoRole = () => {
  if (!isDemoModeEnabled()) {
    // If demo mode is disabled, ensure any manually injected localStorage keys are purged
    if (typeof window !== 'undefined' && window.localStorage) {
      if (localStorage.getItem('demo_role')) {
        localStorage.removeItem('demo_role');
        localStorage.removeItem('demo_jwt_citizen');
        localStorage.removeItem('demo_jwt_worker');
        localStorage.removeItem('demo_jwt_admin');
      }
    }
    return null;
  }
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  const role = localStorage.getItem('demo_role');
  if (role && Object.values(DEMO_ROLES).includes(role)) {
    return role;
  }
  return null;
};

/**
 * Switch the active demo persona.
 * Strictly gated behind VITE_ENABLE_DEMO_MODE.
 * @param {string} role - Target demo role ('citizen', 'worker', 'admin')
 * @returns {boolean} True if switch succeeded, false otherwise
 */
export const switchDemoRole = (role) => {
  if (!isDemoModeEnabled()) {
    console.warn(
      '[Security Notice] Demo mode is disabled (VITE_ENABLE_DEMO_MODE=false). switchDemoRole() refused.'
    );
    return false;
  }

  if (!Object.values(DEMO_ROLES).includes(role)) {
    console.error(`[DemoAuth] Invalid role '${role}'. Expected one of:`, Object.values(DEMO_ROLES));
    return false;
  }

  try {
    const demoTokenKey = `demo_jwt_${role}`;
    // Construct mock demo token structure with embedded role claim
    const mockToken = `demo_jwt_token_${role}_${Date.now()}`;

    localStorage.setItem('demo_role', role);
    localStorage.setItem(demoTokenKey, mockToken);
    localStorage.setItem('auth_token', mockToken);

    // Notify listeners across components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:role-changed', { detail: { role, isDemo: true } }));
    }
    return true;
  } catch (err) {
    console.error('[DemoAuth] Failed to set demo role in storage:', err);
    return false;
  }
};

/**
 * Clear any active demo persona and return to standard mode.
 */
export const clearDemoRole = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('demo_role');
    localStorage.removeItem('demo_jwt_citizen');
    localStorage.removeItem('demo_jwt_worker');
    localStorage.removeItem('demo_jwt_admin');
    // Only remove auth_token if it was a demo token
    const token = localStorage.getItem('auth_token');
    if (token && token.startsWith('demo_jwt_')) {
      localStorage.removeItem('auth_token');
    }
    window.dispatchEvent(
      new CustomEvent('auth:role-changed', { detail: { role: 'citizen', isDemo: false } })
    );
  }
};

/**
 * Get active user role (demo or real authenticated).
 * If demo mode is disabled, demo keys are NEVER consulted.
 * @returns {string} 'citizen', 'worker', or 'admin'
 */
export const getActiveRole = () => {
  // If demo mode is enabled, check demo role first
  if (isDemoModeEnabled()) {
    const demo = getDemoRole();
    if (demo) return demo;
  }

  // Real authenticated user check
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.role && Object.values(DEMO_ROLES).includes(user.role)) {
          return user.role;
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  return DEMO_ROLES.CITIZEN;
};

/**
 * Verify whether the active user has access to a required role.
 * Role hierarchy: admin > worker > citizen
 * @param {string|string[]} requiredRole - Minimum required role or array of allowed roles
 * @returns {boolean} True if authorized, false otherwise
 */
export const hasRoleAccess = (requiredRole) => {
  const currentRole = getActiveRole();

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(currentRole);
  }

  if (currentRole === DEMO_ROLES.ADMIN) {
    return true; // Admin has full access
  }
  if (currentRole === DEMO_ROLES.WORKER) {
    return requiredRole === DEMO_ROLES.WORKER || requiredRole === DEMO_ROLES.CITIZEN;
  }
  return requiredRole === DEMO_ROLES.CITIZEN;
};
