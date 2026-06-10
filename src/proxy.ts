import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  let user: { id: string } | null = null;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    // Auth check failed — treat as unauthenticated
  }

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";

  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Come back to the original destination after signing in (e.g. an invite
    // link to a match room). Only internal paths are accepted.
    const next = pathname + request.nextUrl.search;
    url.search = "";
    if (next !== "/") url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.searchParams.get("next");
    url.search = "";
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      const [nextPath, nextQuery] = next.split("?");
      url.pathname = nextPath;
      if (nextQuery) url.search = nextQuery;
    } else {
      url.pathname = "/";
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
