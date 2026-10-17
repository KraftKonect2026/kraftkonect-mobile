/** Where tapping a push notification opens. Mirrors the in-app notification list so both behave the same. */
export type PushRoute = { pathname: string; params?: Record<string, string> };

export function routeForPush(data: unknown): PushRoute | null {
  const d = (data ?? {}) as Record<string, unknown>;
  const type = typeof d.linkType === "string" ? d.linkType : "";
  const id = typeof d.linkId === "string" ? d.linkId : "";
  if (type === "support") return { pathname: "/support", params: { kind: "help" } };
  if (!id) return type ? { pathname: "/notifications" } : null;
  if (type === "booking") return { pathname: "/request/[id]", params: { id } };
  if (type === "conversation") return { pathname: "/chat/[providerId]", params: { providerId: id } };
  if (type === "payout") return { pathname: "/provider/earnings", params: { step: "payout", payoutId: id } };
  return { pathname: "/notifications" };
}
