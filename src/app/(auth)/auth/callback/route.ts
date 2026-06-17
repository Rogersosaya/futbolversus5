import { NextResponse } from "next/server";

import { createSSRClient } from "@/lib/supabase-server";

/** Internal-only post-login destination (e.g. /jugar/amistoso/ABC123). */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/**
 * Popup-flow response: a tiny page that tells the opener how the exchange went
 * and closes itself. The auth cookies were already written to THIS response by
 * the SSR client, and since the popup shares this window's origin the opener
 * sees the new session immediately. `next` is JSON-encoded into a same-origin
 * postMessage; no user input reaches the HTML directly.
 */
function popupResult(ok: boolean, next: string): NextResponse {
  const message = JSON.stringify({ type: "fv-oauth", ok, next });
  const html = `<!doctype html><meta charset="utf-8"><title>FUTBOL VERSUS</title><script>
(function () {
  try { if (window.opener) window.opener.postMessage(${message}, window.location.origin); } catch (e) {}
  window.close();
})();
</script>`;
  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/**
 * OAuth (PKCE) callback. Google sends the user back here with a one-time `code`;
 * we exchange it for a session — which writes the auth cookies through the SSR
 * client — and then redirect on to the original destination. On failure we send
 * the user back to /login with a flag so the page can explain what happened.
 *
 * Note: this path is allowed through `proxy.ts` while unauthenticated, since the
 * session doesn't exist yet at the moment of the exchange.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  const isPopup = searchParams.get("popup") === "1";

  if (code) {
    const supabase = await createSSRClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (isPopup) return popupResult(true, next);
      // Behind a load balancer the public host is on x-forwarded-host; in dev
      // and direct deployments `origin` is correct.
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocal = process.env.NODE_ENV === "development";
      const base = !isLocal && forwardedHost ? `https://${forwardedHost}` : origin;
      return NextResponse.redirect(`${base}${next}`);
    }
  }

  if (isPopup) return popupResult(false, next);
  const failed = new URL("/login", origin);
  failed.searchParams.set("error", "oauth");
  if (next !== "/") failed.searchParams.set("next", next);
  return NextResponse.redirect(failed);
}
