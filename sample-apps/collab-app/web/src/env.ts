export interface Env {
  ASSETS: Fetcher;
  /** Service binding to the `api` worker. */
  API: Fetcher;
  /** Email used to resolve "me" when no Cf-Access-Authenticated-User-Email header is present (local dev). */
  DEV_FALLBACK_EMAIL: string;
  /** Shared with the `api` worker, gates /admin/* there. */
  ADMIN_INTERNAL_SECRET?: string;
  /** Shared with the `api` worker, gates /internal/* there. */
  WEB_INTERNAL_SECRET?: string;
  /** Shared parent domain every app in this demo suite is deployed under - set by wire-access.sh, used only for the /about-demo cross-links. */
  ROOT_DOMAIN?: string;
}
