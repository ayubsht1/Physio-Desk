import { proxyBackend } from "@/lib/backend";

export async function GET(request: Request) {
  return proxyBackend(request, `/patients${new URL(request.url).search}`);
}

export async function POST(request: Request) {
  return proxyBackend(request, "/patients");
}