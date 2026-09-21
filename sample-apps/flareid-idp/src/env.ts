export interface Env {
  DB: D1Database;
  SESSIONS_KV: KVNamespace;
  APP_NAME: string;
  ISSUER_URL: string;
  /** Public half of the *current* signing key as a JSON JWK string - safe to be non-secret. Published at /jwks.json. */
  SIGNING_PUBLIC_JWK: string;
  /** Key id for the current signing key. Bump this whenever you rotate SIGNING_KEY_PKCS8. */
  SIGNING_KEY_ID?: string;
  /** PKCS8 PEM of the RS256 private key used to sign id_tokens. Set via `wrangler secret put SIGNING_KEY_PKCS8`. */
  SIGNING_KEY_PKCS8?: string;
  /**
   * Public half of the *previous* signing key + its kid, kept published at
   * /jwks.json for a transition window after rotating so tokens issued just
   * before the rotation (up to their ~10m expiry) can still be verified.
   * Remove both once you're sure nothing is still relying on the old key.
   */
  SIGNING_PUBLIC_JWK_PREVIOUS?: string;
  SIGNING_KEY_ID_PREVIOUS?: string;
  /** Any random string, signs the IdP session cookie. Set via `wrangler secret put COOKIE_ENCRYPTION_KEY`. */
  COOKIE_ENCRYPTION_KEY?: string;

  /**
   * The shared parent domain every app in this demo suite is deployed under
   * (e.g. "trustworthy-engine.sxplab.com") - set once by wire-access.sh after
   * it creates everyone's custom domains. Used only to build the "explore the
   * rest of the suite" links on /about-demo (idp./hr./crm./work./wiki. + this
   * domain, per the fixed subdomain convention wire-access.sh uses). Left
   * blank (and the links section just omitted) until then.
   */
  ROOT_DOMAIN?: string;
}
