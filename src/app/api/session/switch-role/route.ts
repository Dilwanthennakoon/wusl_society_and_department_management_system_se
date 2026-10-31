import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, requireSession } from "@/lib/auth";
import { apiErrorResponse, ApiError } from "@/lib/api";
import { ROLES, roleContext } from "@/lib/roles";

const switchSchema = z.object({
  role: z.enum(ROLES),
  workflow: z.enum(["System", "Society", "Department"]),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const data = switchSchema.parse(await request.json());
    const context = roleContext(data.role, data.workflow);
    if (!context || !session.roles.includes(data.role)) {
      throw new ApiError(403, "This role is not assigned to your account");
    }
    const user = { ...session, role: context.role, workflow: context.workflow };
    await createSession(user);
    return NextResponse.json({ user, redirect: context.href });
  } catch (error) {
    return apiErrorResponse(error, "Failed to switch role");
  }
}
