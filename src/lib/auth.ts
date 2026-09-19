import crypto from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "booth-pos-po-secret-salt-2026-key";

/**
 * Hash a PIN using PBKDF2 with SHA-256 and a random 16-byte salt
 */
export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(pin.trim(), salt, 10000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a PIN against either a hashed PIN (salt:hash) or legacy plaintext
 */
export function verifyPin(pin: string, stored: string | null | undefined): boolean {
  if (!stored || !pin) return false;
  const cleanPin = pin.trim();

  // If stored in salt:hash format
  if (stored.includes(":")) {
    const [salt, originalHash] = stored.split(":");
    if (!salt || !originalHash) return false;
    const computedHash = crypto.pbkdf2Sync(cleanPin, salt, 10000, 32, "sha256").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(computedHash, "hex"), Buffer.from(originalHash, "hex"));
  }

  // Legacy plaintext fallback
  return cleanPin === stored.trim();
}

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: string;
}

/**
 * Create a tamper-proof signed session token (HMAC-SHA256)
 */
export function createSessionToken(user: SessionUser): string {
  const payload = Buffer.from(
    JSON.stringify({
      ...user,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

/**
 * Verify a signed session token
 */
export function verifySessionToken(token: string | null | undefined): SessionUser | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");

  if (signature !== expectedSig) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data.exp && Date.now() > data.exp) return null;
    return {
      id: data.id,
      name: data.name,
      username: data.username,
      role: data.role,
    };
  } catch {
    return null;
  }
}
