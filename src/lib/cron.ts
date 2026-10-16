import "server-only";

/** Vercel Cron invia "Authorization: Bearer <CRON_SECRET>": senza, la richiesta viene rifiutata. */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}
