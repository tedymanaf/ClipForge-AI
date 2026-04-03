import { proxyToFastApi } from "@/lib/fastapi-proxy";

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  return proxyToFastApi(request, `/api/process/${params.projectId}`);
}
