import { proxyToFastApi } from "@/lib/fastapi-proxy";

export async function GET(
  request: Request,
  { params }: { params: { projectId: string; clipId: string } }
) {
  return proxyToFastApi(request, `/api/download/${params.projectId}/${params.clipId}`);
}
