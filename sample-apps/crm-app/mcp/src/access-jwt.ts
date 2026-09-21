import type { Env } from "./env.js";

export interface AccessIdTokenClaims {
  email: string;
  name?: string;
  sub: string;
  [key: string]: unknown;
}

function parseJWT(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("token must have 3 parts");
  return {
    data: `${parts[0]}.${parts[1]}`,
    header: JSON.parse(atob(parts[0]!.replace(/-/g, "+").replace(/_/g, "/"))),
    payload: JSON.parse(atob(parts[1]!.replace(/-/g, "+").replace(/_/g, "/"))) as AccessIdTokenClaims & {
      exp: number;
    },
    signatureB64Url: parts[2]!,
  };
}

function base64UrlToUint8Array(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/** Fetches (uncached - fine for a low-traffic workshop demo) Access's JWKS and returns the key matching `kid`. */
async function fetchAccessPublicKey(env: Env, kid: string): Promise<CryptoKey> {
  if (!env.ACCESS_JWKS_URL) throw new Error("ACCESS_JWKS_URL is not configured");
  const res = await fetch(env.ACCESS_JWKS_URL);
  const { keys } = (await res.json()) as { keys: (JsonWebKey & { kid: string })[] };
  const jwk = keys.find((key) => key.kid === kid);
  if (!jwk) throw new Error(`No matching Access signing key for kid=${kid}`);
  return crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
}

/**
 * Verifies an Access-issued id_token (returned from the token exchange in access-handler.ts).
 * See: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
 */
export async function verifyAccessIdToken(env: Env, token: string): Promise<AccessIdTokenClaims> {
  const jwt = parseJWT(token);
  const key = await fetchAccessPublicKey(env, jwt.header.kid);

  const verified = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    base64UrlToUint8Array(jwt.signatureB64Url),
    new TextEncoder().encode(jwt.data)
  );
  if (!verified) throw new Error("Access id_token signature verification failed");

  if (jwt.payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Access id_token has expired");
  }

  return jwt.payload;
}
