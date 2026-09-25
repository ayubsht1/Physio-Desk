import { NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_API_URL ?? "http://localhost:8000/api/v1";

export async function proxyBackend(
  request: Request,
  path: string,
  method = request.method,
  bodyOverride?: string,
) {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);

  let body: string | undefined;
  if (!["GET", "HEAD"].includes(method)) {
    body = bodyOverride ?? await request.text();
    headers.set("content-type", request.headers.get("content-type") ?? "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${backendUrl.replace(/\/$/, "")}${path}`, {
      method,
      headers,
      body,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { detail: "The backend API is unavailable. Start the backend service and try again." },
      { status: 502 },
    );
  }

  const responseBody = await response.text();
  return new NextResponse(responseBody || null, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
  });
}