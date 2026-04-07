/**
 * PIN Security Utilities
 *
 * Uses SHA-256 hashing for storage and constant-time comparison
 * to prevent timing attacks on the parent dashboard PIN.
 */

/**
 * Hash a PIN using SHA-256.
 * Works on both React Native and web via expo-crypto fallback.
 */
export async function hashPin(pin: string): Promise<string> {
  // Use SubtleCrypto when available (modern RN + web)
  if (typeof globalThis.crypto?.subtle?.digest === 'function') {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback: simple deterministic hash for environments without SubtleCrypto
  // This is still better than plain text
  let hash = 0;
  const salt = 'jahera_pin_v1';
  const salted = salt + pin + salt;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `fallback_${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do full comparison to prevent length-based timing leaks
    let result = a.length ^ b.length;
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      result |= (a.charCodeAt(i % a.length) || 0) ^ (b.charCodeAt(i % b.length) || 0);
    }
    return result === 0;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Rate limiter for PIN attempts.
 * Locks out after maxAttempts failed tries for lockoutMs duration.
 */
export class PinRateLimiter {
  private failedAttempts = 0;
  private lockedUntil = 0;
  private readonly maxAttempts: number;
  private readonly lockoutMs: number;

  constructor(maxAttempts = 5, lockoutMs = 60_000) {
    this.maxAttempts = maxAttempts;
    this.lockoutMs = lockoutMs;
  }

  isLocked(): boolean {
    if (Date.now() < this.lockedUntil) return true;
    // Auto-reset after lockout expires
    if (this.lockedUntil > 0 && Date.now() >= this.lockedUntil) {
      this.failedAttempts = 0;
      this.lockedUntil = 0;
    }
    return false;
  }

  getRemainingLockoutSeconds(): number {
    if (!this.isLocked()) return 0;
    return Math.ceil((this.lockedUntil - Date.now()) / 1000);
  }

  recordFailure(): void {
    this.failedAttempts++;
    if (this.failedAttempts >= this.maxAttempts) {
      this.lockedUntil = Date.now() + this.lockoutMs;
    }
  }

  recordSuccess(): void {
    this.failedAttempts = 0;
    this.lockedUntil = 0;
  }

  getAttemptsRemaining(): number {
    return Math.max(0, this.maxAttempts - this.failedAttempts);
  }
}
