import { NextResponse } from "next/server";
import { getStore } from "@/lib/server-db";
import { Role } from "@/lib/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = getStore();
  const userId = Number(id);

  const user = store.users.find((u) => u.id === userId);
  if (!user) {
    return NextResponse.json({ detail: "User not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safeUser } = user;
  return NextResponse.json(safeUser);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const store = getStore();
    const userId = Number(id);

    const index = store.users.findIndex((u) => u.id === userId);
    if (index === -1) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 });
    }

    const current = store.users[index];

    // Check username/email conflicts if modified
    if (body.username && body.username.trim().toLowerCase() !== current.username.toLowerCase()) {
      const exists = store.users.some(
        (u) => u.id !== userId && u.username.toLowerCase() === body.username.trim().toLowerCase()
      );
      if (exists) {
        return NextResponse.json({ detail: "Username already taken." }, { status: 400 });
      }
    }

    if (body.email && body.email.trim().toLowerCase() !== current.email.toLowerCase()) {
      const exists = store.users.some(
        (u) => u.id !== userId && u.email.toLowerCase() === body.email.trim().toLowerCase()
      );
      if (exists) {
        return NextResponse.json({ detail: "Email already in use." }, { status: 400 });
      }
    }

    const updated = {
      ...current,
      full_name: body.full_name !== undefined ? body.full_name.trim() : current.full_name,
      username: body.username !== undefined ? body.username.trim() : current.username,
      email: body.email !== undefined ? body.email.trim() : current.email,
      role: body.role !== undefined ? ((body.role === "admin" ? "admin" : "staff") as Role) : current.role,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : current.is_active,
      phone: body.phone !== undefined ? (body.phone ? String(body.phone).trim() : null) : current.phone,
      password_hash: body.password && String(body.password).trim().length > 0
        ? String(body.password).trim()
        : current.password_hash,
    };

    store.users[index] = updated;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...safeUser } = updated;
    return NextResponse.json(safeUser);
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Invalid payload" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = getStore();
  const userId = Number(id);

  if (userId === 1) {
    return NextResponse.json(
      { detail: "Cannot delete the primary root administrator account." },
      { status: 400 }
    );
  }

  const userExists = store.users.some((u) => u.id === userId);
  if (!userExists) {
    return NextResponse.json({ detail: "User not found" }, { status: 404 });
  }

  store.users = store.users.filter((u) => u.id !== userId);
  return NextResponse.json({ message: "User account deleted successfully." });
}
