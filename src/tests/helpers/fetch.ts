export function createJsonRequest(
  url: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: Record<string, unknown>
): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function callRouteHandler(
  handler: (request: Request, context?: { params: Promise<Record<string, string>> }) => Promise<Response>,
  request: Request,
  params?: Record<string, string>
): Promise<Response> {
  if (params) {
    return handler(request, { params: Promise.resolve(params) });
  }
  return handler(request);
}
