import { proxyBackend } from "@/lib/backend";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyBackend(request, `/admin/users/${id}`, "PATCH");
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyBackend(request, `/admin/users/${id}`, "PATCH", JSON.stringify({ is_active: false }));
}