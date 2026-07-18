import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "medicio-default-jwt-secret-key-102938475";

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

/**
 * Signs a JWT token with the local secret key.
 */
export function signJwt(payload: object, expiresInDays: number = 7): string {
  const header = { alg: "HS256", typ: "JWT" };
  const base64UrlHeader = base64UrlEncode(JSON.stringify(header));
  
  // Inject exp claim (expiration time in seconds)
  const exp = Math.floor(Date.now() / 1000) + (expiresInDays * 24 * 60 * 60);
  const enrichedPayload = { ...payload, exp };
  const base64UrlPayload = base64UrlEncode(JSON.stringify(enrichedPayload));
  
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${base64UrlHeader}.${base64UrlPayload}`)
    .digest("base64url");
    
  return `${base64UrlHeader}.${base64UrlPayload}.${signature}`;
}

/**
 * Verifies a JWT token signature and returns the payload or null.
 */
export function verifyJwt(token: string): any {
  try {
    const [headerStr, payloadStr, signature] = token.split(".");
    if (!headerStr || !payloadStr || !signature) return null;
    
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${headerStr}.${payloadStr}`)
      .digest("base64url");
      
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(base64UrlDecode(payloadStr));
    
    // Check if token has expired
    if (payload && typeof payload.exp === "number") {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (currentTimestamp > payload.exp) {
        return null;
      }
    }
    
    return payload;
  } catch {
    return null;
  }
}
