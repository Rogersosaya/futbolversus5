"use client";

import { Suspense, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Tab = "login" | "register";

/** Internal-only post-login destination (e.g. /jugar/amistoso/ABC123). */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/** Message the OAuth popup posts back to this window when the exchange settles. */
type OAuthMessage = { type: "fv-oauth"; ok: boolean; next?: string };

/** Open a centered popup. Returns null if the browser blocked it. */
function openCenteredPopup(name: string, w: number, h: number): Window | null {
  const y = window.top!.outerHeight / 2 + window.top!.screenY - h / 2;
  const x = window.top!.outerWidth / 2 + window.top!.screenX - w / 2;
  return window.open(
    "about:blank",
    name,
    `popup=1,width=${w},height=${h},top=${Math.max(y, 0)},left=${Math.max(x, 0)}`,
  );
}

export default function LoginPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = safeNext(params.get("next"));
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; msg: string } | null>(
    // Surface a failed OAuth round-trip the callback bounced back here.
    () =>
      params.get("error") === "oauth"
        ? { type: "error", msg: "No se pudo completar el ingreso con Google. Inténtalo de nuevo." }
        : null,
  );
  const [isPending, startTransition] = useTransition();
  const [googlePending, setGooglePending] = useState(false);
  const busy = isPending || googlePending;

  // Live handle on the OAuth popup + a guard so the "popup closed" watcher
  // doesn't fire after a successful sign-in already navigated us away.
  const popupRef = useRef<Window | null>(null);
  const settledRef = useRef(false);

  // The popup runs Google's account chooser, hits /auth/callback (which sets the
  // session cookies — shared with this same-origin window), then posts back here
  // and closes itself. We just react to that message.
  useEffect(() => {
    function onMessage(e: MessageEvent<OAuthMessage>) {
      if (e.origin !== window.location.origin || e.data?.type !== "fv-oauth") return;
      settledRef.current = true;
      popupRef.current?.close();
      popupRef.current = null;
      if (e.data.ok) {
        router.replace(safeNext(e.data.next ?? nextUrl));
        router.refresh();
      } else {
        setGooglePending(false);
        setFeedback({
          type: "error",
          msg: "No se pudo completar el ingreso con Google. Inténtalo de nuevo.",
        });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router, nextUrl]);

  function switchTab(t: Tab) {
    setTab(t);
    setFeedback(null);
  }

  function signInWithGoogle() {
    setFeedback(null);
    setGooglePending(true);
    settledRef.current = false;
    const supabase = createClient();

    // Open the popup synchronously inside the click so the browser doesn't block
    // it; it shows about:blank until we point it at Google's consent URL.
    const popup = openCenteredPopup("fv-google-auth", 480, 640);
    popupRef.current = popup;

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`;

    if (!popup) {
      // Popup blocked → fall back to a normal full-page redirect.
      void supabase.auth
        .signInWithOAuth({ provider: "google", options: { redirectTo } })
        .then(({ error }) => {
          if (error) {
            setGooglePending(false);
            setFeedback({ type: "error", msg: "No se pudo iniciar con Google. Inténtalo de nuevo." });
          }
        });
      return;
    }

    void supabase.auth
      .signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${redirectTo}&popup=1`, skipBrowserRedirect: true },
      })
      .then(({ data, error }) => {
        if (error || !data?.url) {
          popup.close();
          popupRef.current = null;
          setGooglePending(false);
          setFeedback({ type: "error", msg: "No se pudo iniciar con Google. Inténtalo de nuevo." });
          return;
        }
        popup.location.href = data.url;
        // If the user closes the popup before finishing, release the busy state.
        const watch = setInterval(() => {
          if (popup.closed) {
            clearInterval(watch);
            if (!settledRef.current) setGooglePending(false);
          }
        }, 600);
      });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const supabase = createClient();

    startTransition(async () => {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setFeedback({ type: "error", msg: translateError(error.message) });
          return;
        }
        router.push(nextUrl);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setFeedback({ type: "error", msg: translateError(error.message) });
          return;
        }
        if (data.session) {
          // Email confirmation disabled — logged in immediately
          router.push(nextUrl);
          router.refresh();
        } else {
          setFeedback({ type: "success", msg: "Revisa tu correo y confirma tu cuenta para ingresar." });
        }
      }
    });
  }

  return (
    <div className="auth-page">
      <div className="bg">
        <div className="streaks" />
        <div className="vignette" />
      </div>

      <div className="auth-body">
        <div className="auth-brand">
          <div className="auth-mark">V</div>
          <div className="auth-wordmark">
            FUTBOL<span>·</span>VERSUS
          </div>
          <div className="auth-tagline">Ingresa a tu presidencia</div>
        </div>

        <div className="auth-card">
          <div className="auth-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={tab === "login"}
              className={`auth-tab${tab === "login" ? " on" : ""}`}
              onClick={() => switchTab("login")}
            >
              INGRESAR
            </button>
            <button
              role="tab"
              aria-selected={tab === "register"}
              className={`auth-tab${tab === "register" ? " on" : ""}`}
              onClick={() => switchTab("register")}
            >
              REGISTRARSE
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-fields" noValidate>
            <div className="auth-field">
              <label htmlFor="auth-email">CORREO ELECTRÓNICO</label>
              <input
                id="auth-email"
                type="email"
                className="auth-input"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={busy}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password">CONTRASEÑA</label>
              <input
                id="auth-password"
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                disabled={busy}
              />
            </div>

            {feedback && (
              <p className={feedback.type === "error" ? "auth-error" : "auth-success"}>
                {feedback.msg}
              </p>
            )}

            <button type="submit" className="btn-auth" disabled={busy}>
              {isPending ? (
                "..."
              ) : tab === "login" ? (
                <>
                  INGRESAR AL CAMPO
                  <ArrowIcon />
                </>
              ) : (
                <>
                  CREAR CUENTA
                  <ArrowIcon />
                </>
              )}
            </button>
          </form>

          <div className="auth-or">
            <span>O</span>
          </div>

          <button
            type="button"
            className="btn-google"
            onClick={signInWithGoogle}
            disabled={busy}
          >
            <GoogleIcon />
            {googlePending ? "Conectando con Google…" : "Continuar con Google"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.583-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.709A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.709V4.959H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.041l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.959L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function translateError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (msg.includes("User already registered")) return "Ya existe una cuenta con este correo.";
  if (msg.includes("Password should be at least")) return "La contraseña debe tener al menos 6 caracteres.";
  if (msg.includes("Email not confirmed")) return "Confirma tu correo antes de ingresar.";
  if (msg.includes("For security purposes")) return "Demasiados intentos. Espera unos minutos.";
  return "Ocurrió un error. Inténtalo de nuevo.";
}
