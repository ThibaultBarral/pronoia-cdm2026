import type { NextRequest } from "next/server";
import crypto from "node:crypto";
import { getWhop } from "@/lib/whop";
import { syncMembershipToDb, type WhopMembership } from "@/lib/whop-sync";

export const runtime = "nodejs";

/**
 * Verify a Whop webhook (Standard Webhooks format).
 * Whop signs HMAC-SHA256 with the RAW secret string (incl. the `ws_` prefix) as
 * the key — NOT base64-decoded — so we verify manually rather than via the SDK's
 * `unwrap` (which base64-decodes the key and therefore always fails on Whop).
 */
function verifySignature(secret: string, h: Record<string, string>, body: string): boolean {
  const id = h["webhook-id"];
  const ts = h["webhook-timestamp"];
  const sigHeader = h["webhook-signature"];
  if (!id || !ts || !sigHeader) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${id}.${ts}.${body}`)
    .digest("base64");
  const expBuf = Buffer.from(expected);

  // The header may carry several space-separated "v1,<sig>" entries.
  for (const part of sigHeader.split(" ")) {
    const sig = part.split(",")[1];
    if (!sig) continue;
    const sigBuf = Buffer.from(sig);
    if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
      return true;
    }
  }
  return false;
}

interface WhopWebhookBody {
  type?: string;
  data?: unknown;
}

/** Pull a membership id out of a payment/refund payload (shape varies). */
function membershipIdFrom(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const m = d.membership;
  if (typeof m === "string") return m;
  if (m && typeof m === "object" && typeof (m as Record<string, unknown>).id === "string") {
    return (m as Record<string, unknown>).id as string;
  }
  if (typeof d.membership_id === "string") return d.membership_id;
  return null;
}

export async function POST(request: NextRequest): Promise<Response> {
  const body = await request.text();
  const headers = Object.fromEntries(request.headers);

  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret || !verifySignature(secret, headers, body)) {
    console.error("[whop-webhook] signature verification failed");
    return new Response("invalid signature", { status: 400 });
  }

  let event: WhopWebhookBody;
  try {
    event = JSON.parse(body) as WhopWebhookBody;
  } catch {
    return new Response("invalid body", { status: 400 });
  }

  console.log("[whop-webhook] received event:", event.type);

  try {
    const type = event.type ?? "";
    if (type.startsWith("membership.")) {
      // membership.* events carry the full membership in `data`.
      const res = await syncMembershipToDb(event.data as WhopMembership);
      console.log("[whop-webhook] sync result:", type, JSON.stringify(res));
    } else if (type === "payment.succeeded" || type === "refund.created") {
      // Renewals & refunds reference a membership → fetch it fresh and re-sync
      // so current_period_end / status stay accurate (recurring plans, revokes).
      const memId = membershipIdFrom(event.data);
      if (memId) {
        const membership = await getWhop().memberships.retrieve(memId);
        const res = await syncMembershipToDb(membership as unknown as WhopMembership);
        console.log("[whop-webhook] sync via", type, memId, JSON.stringify(res));
      } else {
        console.log("[whop-webhook]", type, "without membership id — skipped");
      }
    } else {
      console.log("[whop-webhook] ignored event:", type);
    }
  } catch (err) {
    console.error("[whop-webhook] handler error:", err);
    // Still 200 so Whop doesn't retry a poison event forever.
  }

  return new Response("OK", { status: 200 });
}
