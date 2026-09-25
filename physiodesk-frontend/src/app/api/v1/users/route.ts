import { NextResponse } from "next/server";
import { getStore } from "@/lib/server-db";
import { Role } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase().trim();
  const role = searchParams.get("role");

  const store = getStore();
  let list = store.users;

  if (search) {
    list = list.filter(
      (u) =>
        u.username.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.full_name.toLowerCase().includes(search) ||
        (u.phone && u.phone.toLowerCase().includes(search))
    );
  }

  if (role) {
    list = list.filter((u) => u.role === role);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const safeUsers = list.map(({ password_hash, ...u }) => ({
    ...u,
    is_active: u.is_active !== undefined ? u.is_active : true,
  }));

  return NextResponse.json(safeUsers);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, full_name, role, password, is_active, phone } = body;

    if (!username || !email || !full_name) {
      return NextResponse.json(
        { detail: "Username, email, and full name are required." },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const store = getStore();

    // Check uniqueness
    const exists = store.users.some(
      (u) =>
        u.username.toLowerCase() === cleanUsername ||
        u.email.toLowerCase() === cleanEmail
    );

    if (exists) {
      return NextResponse.json(
        { detail: "A user with this username or email already exists." },
        { status: 400 }
      );
    }

    const newUser = {
      id: store.nextUserId++,
      username: username.trim(),
      email: email.trim(),
      full_name: full_name.trim(),
      role: (role === "admin" ? "admin" : "staff") as Role,
      password_hash: password ? String(password).trim() : "welcome123",
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      phone: phone ? String(phone).trim() : null,
      created_at: new Date().toISOString().slice(0, 10),
      last_login: null,
    };

    store.users.push(newUser);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...safeUser } = newUser;
    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Invalid payload" },
      { status: 400 }
    );
  }
}
