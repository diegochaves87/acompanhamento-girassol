import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/cadastro"];
const AUTH_ROUTES = ["/login", "/cadastro"];

function getRoleDestination(role: string | undefined): string {
  return role === "therapist" ? "/terapeuta" : "/familia";
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Sempre chamar getUser para renovar o token de sessão
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const role = user?.user_metadata?.role as string | undefined;

  // Usuário autenticado em rota de autenticação ou raiz → redireciona para o dashboard
  if (user && (AUTH_ROUTES.some((r) => pathname === r) || pathname === "/")) {
    return NextResponse.redirect(
      new URL(getRoleDestination(role), request.url)
    );
  }

  // Sem sessão em rota protegida → redireciona para login
  if (!user && !PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Proteção cruzada: terapeuta tentando acessar /familia e vice-versa
  if (user && role && pathname.startsWith("/terapeuta") && role !== "therapist") {
    return NextResponse.redirect(new URL("/familia", request.url));
  }

  if (user && role && pathname.startsWith("/familia") && role !== "family") {
    return NextResponse.redirect(new URL("/terapeuta", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
