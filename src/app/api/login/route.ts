import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { assignedRoles, roleContext, ROLE_CONTEXTS } from "@/lib/roles";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 },
      );
    }

    const admin = await prisma.admin.findUnique({
      where: {
        admin_email: email,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    const passwordMatches = admin.admin_password.startsWith("$2")
      ? await bcrypt.compare(password, admin.admin_password)
      : admin.admin_password === password;

    if (!passwordMatches) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (admin.status !== "Active") {
      return NextResponse.json(
        { message: "Your account is not active" },
        { status: 403 },
      );
    }

    const roles = assignedRoles(admin);
    const available = ROLE_CONTEXTS.filter((item) => roles.includes(item.role));
    const context = body.role
      ? available.find((item) => item.role === body.role && (!body.workflow || item.workflow === body.workflow))
      : body.workflow
        ? available.find((item) => item.role === admin.admin_role && item.workflow === body.workflow)
          || available.find((item) => item.workflow === body.workflow)
          || available.find((item) => item.role === "System Admin")
        : roleContext(admin.admin_role || "") || available[0];
    if (!context) {
      return NextResponse.json({ message: "No assigned role is available for this login" }, { status: 403 });
    }
    const user = {
      id: admin.admin_id,
      name: admin.admin_name,
      email: admin.admin_email,
      role: context.role,
      roles,
      workflow: context.workflow,
    };

    await createSession(user);

    return NextResponse.json({
      message: "Login successful",
      user,
      redirect: context.href,
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
