import { proxyToFastApi } from "@/lib/fastapi-proxy";

export async function GET(request: Request) {
  return proxyToFastApi(request, "/api/upload");
}

export async function POST(request: Request) {
  return proxyToFastApi(request, "/api/upload");
}
