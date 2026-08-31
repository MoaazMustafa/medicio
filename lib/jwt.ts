export type UserRole =
  | "PATIENT"
  | "DOCTOR"
  | "HOSPITAL_ADMIN"
  | "LAB_ADMIN"
  | "PHARMACY_ADMIN"
  | "ADMIN"
  | "SUPER_ADMIN";

/**
 * HS256 JWT helpers built on the Web Crypto API so the exact same implementation
 * runs in the Node.js runtime (Route Handlers) and the Edge runtime (middleware).
 * Signature checks use `crypto.subtle.verify`, which compares in constant time.
 */

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
  iat: number;
  exp: number;
}

const DEFAULT_EXPIRY_DAYS = 7;
const DEV_FALLBACK_SECRET = "medicio-development-only-secret-change-before-deploy";
const MIN_SECRET_LENGTH = 32;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

let cachedKey: CryptoKey | null = null;
let cachedSecret: string | null = null;

function getSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `JWT_SECRET must be set to at least ${MIN_SECRET_LENGTH} characters in production.`,
      );
    }

    return DEV_FALLBACK_SECRET;
  }

  return secret;
}

async function getSigningKey(): Promise<CryptoKey> {
  const secret = getSecret();

  if (cachedKey && cachedSecret === secret) {
    return cachedKey;
  }

  cachedKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  cachedSecret = secret;

  return cachedKey;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlToBytes(value: string): Uint8Array {
  let base64 = value.replace(/-/g, "+").replace(/_/g, "/");

  while (base64.length % 4) {
    base64 += "=";
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function encodeSegment(value: object): string {
  return bytesToBase64Url(encoder.encode(JSON.stringify(value)));
}

/**
 * Signs a session token with the configured secret key.
 */
export async function signJwt(
  payload: Omit<SessionPayload, "iat" | "exp">,
  expiresInDays: number = DEFAULT_EXPIRY_DAYS,
): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = encodeSegment({ alg: "HS256", typ: "JWT" });
  const body = encodeSegment({
    ...payload,
    iat: issuedAt,
    exp: issuedAt + expiresInDays * 24 * 60 * 60,
  });
  const signingInput = `${header}.${body}`;

  const signature = await crypto.subtle.sign(
    "HMAC",
    await getSigningKey(),
    encoder.encode(signingInput),
  );

  return `${signingInput}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

/**
 * Verifies a session token signature and expiry, returning the payload or null.
 */
export async function verifyJwt(token: string): Promise<SessionPayload | null> {
  try {
    const [header, body, signature] = token.split(".");

    if (!header || !body || !signature) return null;

    const isValidSignature = await crypto.subtle.verify(
      "HMAC",
      await getSigningKey(),
      base64UrlToBytes(signature) as BufferSource,
      encoder.encode(`${header}.${body}`),
    );

    if (!isValidSignature) return null;

    const payload = JSON.parse(decoder.decode(base64UrlToBytes(body))) as SessionPayload;

    if (!payload?.userId || !payload?.role) return null;
    if (typeof payload.exp !== "number") return null;
    if (Math.floor(Date.now() / 1000) >= payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}
