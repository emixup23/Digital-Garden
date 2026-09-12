export interface AuthUser {
  email: string;
  name: string;
  role: 'owner' | 'collaborator';
  authenticatedAt: string;
}

const AUTH_STORAGE_KEY = 'pkm_vault_auth_token';
const AUTH_USER_KEY = 'pkm_vault_auth_user';
const FAILED_ATTEMPTS_KEY = 'pkm_vault_failed_attempts';
const CUSTOM_CREDENTIALS_KEY = 'pkm_vault_custom_creds';

// Default master credentials requested by user
export const MASTER_CREDENTIALS = {
  email: 'emixup23@gmail.com',
  password: '7441g-FGf632-AqWdfF',
};

export function getStoredCredentials(): { email: string; password: string } {
  try {
    const raw = localStorage.getItem(CUSTOM_CREDENTIALS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.email && parsed.password) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return MASTER_CREDENTIALS;
}

export function saveCustomCredentials(email: string, password: string): void {
  try {
    localStorage.setItem(CUSTOM_CREDENTIALS_KEY, JSON.stringify({ email, password }));
  } catch (err) {
    console.error('Failed to save credentials:', err);
  }
}

export function getAuthUser(): AuthUser | null {
  try {
    // Check localStorage (Remember Me) first, then sessionStorage
    const rawLocal = localStorage.getItem(AUTH_USER_KEY);
    const rawSession = sessionStorage.getItem(AUTH_USER_KEY);
    const raw = rawLocal || rawSession;
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const token = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
  return Boolean(token && getAuthUser());
}

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
}

export function login(emailInput: string, passwordInput: string, rememberMe = true): LoginResult {
  const creds = getStoredCredentials();

  // Check rate limiting / lockouts
  try {
    const attemptsRaw = localStorage.getItem(FAILED_ATTEMPTS_KEY);
    if (attemptsRaw) {
      const { count, lastAttempt } = JSON.parse(attemptsRaw);
      const elapsed = Date.now() - lastAttempt;
      if (count >= 5 && elapsed < 30000) {
        const remainingSec = Math.ceil((30000 - elapsed) / 1000);
        return {
          success: false,
          error: `Too many failed attempts. Security cooldown in effect. Try again in ${remainingSec}s.`,
        };
      }
    }
  } catch {
    // ignore
  }

  const cleanEmail = emailInput.trim().toLowerCase();
  const targetEmail = creds.email.trim().toLowerCase();

  // Also accept MASTER_CREDENTIALS if custom creds were set but didn't match
  const isMasterEmail = cleanEmail === MASTER_CREDENTIALS.email.toLowerCase();
  const isMasterPassword = passwordInput === MASTER_CREDENTIALS.password;

  const isCustomEmail = cleanEmail === targetEmail;
  const isCustomPassword = passwordInput === creds.password;

  const isValid = (isCustomEmail && isCustomPassword) || (isMasterEmail && isMasterPassword);

  if (!isValid) {
    // Record failed attempt
    try {
      const attemptsRaw = localStorage.getItem(FAILED_ATTEMPTS_KEY);
      let count = 1;
      if (attemptsRaw) {
        const parsed = JSON.parse(attemptsRaw);
        count = (parsed.count || 0) + 1;
      }
      localStorage.setItem(
        FAILED_ATTEMPTS_KEY,
        JSON.stringify({ count, lastAttempt: Date.now() })
      );
    } catch {
      // ignore
    }

    return {
      success: false,
      error: 'Invalid email or password. Please verify your credentials and try again.',
    };
  }

  // Success - clear failed attempts
  try {
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
  } catch {
    // ignore
  }

  const user: AuthUser = {
    email: cleanEmail,
    name: cleanEmail.split('@')[0],
    role: 'owner',
    authenticatedAt: new Date().toISOString(),
  };

  const token = `vault_session_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  if (rememberMe) {
    localStorage.setItem(AUTH_STORAGE_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    // Clear session storage if any
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
  } else {
    sessionStorage.setItem(AUTH_STORAGE_KEY, token);
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    // Clear local storage
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }

  return {
    success: true,
    user,
  };
}

export function logout(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
  } catch (err) {
    console.error('Error during logout:', err);
  }
}
