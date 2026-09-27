import { NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_API_URL;

export async function proxyBackend(
  request: Request,
  path: string,
  method = request.method,
  bodyOverride?: string,
) {
  if (!backendUrl) {
    return NextResponse.json(
      { detail: "BACKEND_API_URL is not configured" },
      { status: 500 },
    );
  }

  const headers = new Headers();

  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.set("authorization", authorization);
  }

  let body: string | undefined;

  if (!["GET", "HEAD"].includes(method)) {
    body = bodyOverride ?? await request.text();

    headers.set(
      "content-type",
      request.headers.get("content-type") ?? "application/json",
    );
  }

  try {
    const response = await fetch(
      `${backendUrl.replace(/\/$/, "")}${path}`,
      {
        method,
        headers,
        body,
        cache: "no-store",
      },
    );

    const responseBody = await response.text();

    return new NextResponse(responseBody || null, {
      status: response.status,
      headers: {
        "content-type":
          response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("Backend proxy error:", error);

    return NextResponse.json(
      { detail: "The backend API is unavailable." },
      { status: 502 },
    );
  }
}