"use server";

import { setAdmin, setFreeAccess } from "@/lib/admin";

/** Grant/revoke admin by email. Guarded server-side (setAdmin checks isAdmin). */
export async function setAdminAction(
  email: string,
  value: boolean
): Promise<{ ok: boolean; error?: string }> {
  return setAdmin(email, value);
}

/** Grant/revoke free VIP access by email. Guarded server-side (checks isAdmin). */
export async function setFreeAccessAction(
  email: string,
  value: boolean
): Promise<{ ok: boolean; error?: string }> {
  return setFreeAccess(email, value);
}
