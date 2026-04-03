import { proxyToFastApi } from "@/lib/fastapi-proxy";

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  return proxyToFastApi(request, `/api/status/${params.projectId}`);
}
