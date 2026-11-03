import { NextResponse, type NextRequest } from "next/server";

// Maps <slug>.<root-domain> onto that tenant's career site routes.
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.delete("x-career-subdomain");

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const root = process.env.ROOT_DOMAIN ?? "localhost:3000";
  const slug = host.endsWith(`.${root}`) ? host.slice(0, -root.length - 1) : null;

  if (!slug || slug === "www" || slug.includes(".")) {
    return NextResponse.next({ request: { headers } });
  }

  headers.set("x-career-subdomain", slug);
  const url = request.nextUrl.clone();
  const base = `/careers/${slug}`;
  if (url.pathname !== base && !url.pathname.startsWith(`${base}/`)) {
    url.pathname = url.pathname === "/" ? base : `${base}${url.pathname}`;
  }
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|api/).*)"],
};
