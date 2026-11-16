import { sendNotification, setVapidDetails, type PushSubscription } from "web-push";

// Phase 0 test only: sends one notification to the subscription the caller provides,
// after a short delay so you have time to leave the app. Replaced by real reminders in Phase 5.
export const maxDuration = 30;

const MAX_DELAY_SECONDS = 15;

function isSubscription(value: unknown): value is PushSubscription {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const keys = v.keys as Record<string, unknown> | undefined;
  return (
    typeof v.endpoint === "string" &&
    v.endpoint.startsWith("https://") &&
    !!keys &&
    typeof keys.p256dh === "string" &&
    typeof keys.auth === "string"
  );
}

export async function POST(request: Request) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return Response.json(
      { ok: false, error: "Push keys are not set on the server (VAPID env vars missing)." },
      { status: 500 }
    );
  }

  let body: { subscription?: unknown; delaySeconds?: unknown; count?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  if (!isSubscription(body.subscription)) {
    return Response.json({ ok: false, error: "Missing or invalid push subscription." }, { status: 400 });
  }

  const delay = Math.min(Math.max(Number(body.delaySeconds) || 0, 0), MAX_DELAY_SECONDS);
  const count = Math.min(Math.max(Number(body.count) || 3, 0), 99);

  // The VAPID subject must be a mailto: or https: URL; use this app's own address.
  const origin = new URL(request.url).origin;
  setVapidDetails(origin.startsWith("https://") ? origin : "https://example.com", publicKey, privateKey);

  if (delay > 0) await new Promise((r) => setTimeout(r, delay * 1000));

  try {
    await sendNotification(
      body.subscription,
      JSON.stringify({
        title: "Dispatch test",
        body: `${count} actions overdue (test notification — tap to open Dispatch)`,
        url: "/spike",
      })
    );
    return Response.json({ ok: true });
  } catch (err) {
    const e = err as { statusCode?: number; body?: string; message?: string };
    return Response.json(
      { ok: false, error: `Push service rejected it: ${e.statusCode ?? ""} ${e.body ?? e.message ?? ""}`.trim() },
      { status: 502 }
    );
  }
}
