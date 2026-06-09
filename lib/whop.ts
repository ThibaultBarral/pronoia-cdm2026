import { Whop } from "@whop/sdk";

/**
 * Lazily-instantiated server-side Whop REST client.
 * Lazy so an empty/missing WHOP_API_KEY can't throw at import time (which would
 * break the build); it only throws when actually used without configuration.
 *
 * - apiKey: Whop dashboard → Developer → API keys.
 * - webhookKey: the SDK reads WHOP_WEBHOOK_SECRET from env and uses it inside
 *   `whop.webhooks.unwrap()` to verify the Standard Webhooks signature.
 */
let _whop: Whop | null = null;

export function getWhop(): Whop {
  if (!_whop) {
    const apiKey = process.env.WHOP_API_KEY;
    if (!apiKey) {
      throw new Error("WHOP_API_KEY manquant — configure-le dans .env.local");
    }
    _whop = new Whop({ apiKey });
  }
  return _whop;
}
