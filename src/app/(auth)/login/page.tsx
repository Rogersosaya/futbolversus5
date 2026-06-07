"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Tab = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function switchTab(t: Tab) {
    setTab(t);
    setFeedback(null);
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
        router.push("/");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setFeedback({ type: "error", msg: translateError(error.message) });
          return;
        }
        if (data.session) {
          // Email confirmation disabled — logged in immediately
          router.push("/");
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
                disabled={isPending}
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
                disabled={isPending}
              />
            </div>

            {feedback && (
              <p className={feedback.type === "error" ? "auth-error" : "auth-success"}>
                {feedback.msg}
              </p>
            )}

            <button type="submit" className="btn-auth" disabled={isPending}>
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
        </div>
      </div>
    </div>
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
