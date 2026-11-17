import type { ApiError } from './api';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PasswordStrength {
  minLength: boolean;
  maxLength: boolean;
  hasLower: boolean;
  hasUpper: boolean;
  hasDigit: boolean;
  valid: boolean;
}

/**
 * Matches backend `strongPasswordSchema` (`min 8`, `max 128`, lower, upper, digit).
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  const minLength = password.length >= 8;
  const maxLength = password.length <= 128;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  return {
    minLength,
    maxLength,
    hasLower,
    hasUpper,
    hasDigit,
    valid: minLength && maxLength && hasLower && hasUpper && hasDigit,
  };
}

export function formatPasswordError(password: string): string | null {
  const checks = evaluatePasswordStrength(password);
  if (!checks.minLength) return 'Password must be at least 8 characters long.';
  if (!checks.maxLength) return 'Password must be at most 128 characters long.';
  if (!checks.hasLower) return 'Password must include a lowercase letter.';
  if (!checks.hasUpper) return 'Password must include an uppercase letter.';
  if (!checks.hasDigit) return 'Password must include a number.';
  return null;
}

/**
 * Converts backend `ApiError` objects into clean, human-readable UI messages.
 */
export function formatAuthError(error: unknown, fallback: string): string {
  const err = error as ApiError | undefined;
  if (err?.status === 401) {
    return 'Invalid email or password.';
  }
  if (err?.status === 409) {
    return 'An account already exists with this email. Sign in instead.';
  }
  if (err?.status === 400) {
    const fieldMessages = err.fields
      ? Object.entries(err.fields)
          .flatMap(([, msgs]) => (Array.isArray(msgs) ? msgs : []))
          .filter(Boolean)
      : [];
    if (fieldMessages.length > 0) {
      return fieldMessages[0];
    }
    return err.message || 'Please check the entered details and try again.';
  }
  return error instanceof Error ? error.message : fallback;
}
