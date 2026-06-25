import { NextResponse, type NextRequest } from "next/server";
import { createLogger } from "@/shared/lib/logger";

const log = createLogger("http");

/**
 * Lightweight request logger: emits one line per request with method, path,
 * status and duration. Generates a requestId header so downstream handlers
 * (and the logger in API routes) can correlate logs to a single request.
 */
export function middleware(req: NextRequest) {
  const startedAt = Date.now();
  const requestId =
    req.headers.get("x-request-id") ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const forwardedHeaders = new Headers(req.headers);
  forwardedHeaders.set("x-request-id", requestId);
  const res = NextResponse.next({
    request: { headers: forwardedHeaders },
  });
  res.headers.set("x-request-id", requestId);

  const method = req.method;
  const path = req.nextUrl.pathname;

  // Fire the log on response finish (approximated via a microtask after).
  void Promise.resolve().then(() => {
    const durationMs = Date.now() - startedAt;
    log.info("request", {
      requestId,
      method,
      path,
      durationMs,
    });
  });

  return res;
}

export const config = {
  // Skip static assets, Next internals, and favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
