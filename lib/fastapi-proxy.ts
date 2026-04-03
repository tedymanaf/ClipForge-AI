const FASTAPI_BASE_URL = process.env.CLIPFORGE_FASTAPI_URL ?? "http://127.0.0.1:8000";

function buildProxyHeaders(source: Headers) {
  const headers = new Headers(source);

  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  return headers;
}

export async function proxyToFastApi(request: Request, path: string) {
  const url = `${FASTAPI_BASE_URL}${path}`;

  try {
    const init: RequestInit & { duplex?: "half" } = {
      method: request.method,
      headers: buildProxyHeaders(request.headers),
      cache: "no-store"
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
      init.duplex = "half";
    }

    const response = await fetch(url, init);
    const headers = new Headers(response.headers);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "FastAPI backend is unavailable.";

    return Response.json(
      {
        detail: "Backend FastAPI tidak bisa dijangkau dari Next.js.",
        error: message
      },
      { status: 502 }
    );
  }
}
