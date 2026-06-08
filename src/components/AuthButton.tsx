"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { signOut } from "@/app/actions/auth";

const LogoutIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

const LoginIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <path d="M10 17l5-5-5-5" />
    <path d="M15 12H3" />
  </svg>
);

/** Topbar auth control: logout when signed in, otherwise a link to /login. */
export function AuthButton({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!loggedIn) {
    return (
      <Link className="auth-btn" href="/login">
        <LoginIcon />
        Iniciar sesión
      </Link>
    );
  }

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button className="auth-btn" onClick={handleSignOut} disabled={isPending} type="button">
      <LogoutIcon />
      {isPending ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
