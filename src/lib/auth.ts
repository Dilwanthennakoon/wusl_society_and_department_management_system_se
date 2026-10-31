import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { assignedRoles, roleContext, type Role, type Workflow } from "@/lib/roles";

const SESSION_COOKIE = "wusl_session";
const ROLE_SESSION_COOKIE_PREFIX = `${SESSION_COOKIE}_`;

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  roles: Role[];
  workflow: Workflow;
};

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is not configured");
  return value;
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export async function createSession(user: SessionUser) {
  const token = jwt.sign(user, secret(), { expiresIn: "7d" });
  const store = await cookies();
  const options = sessionCookieOptions();

  // Retire legacy role cookies: only the explicitly selected role may authorize requests.
  for (const cookie of store.getAll()) {
    if (cookie.name.startsWith(ROLE_SESSION_COOKIE_PREFIX)) store.delete(cookie.name);
  }
  store.set(SESSION_COOKIE, token, options);
}

export async function clearSession() {
  const store = await cookies();
  for (const cookie of store.getAll()) {
    if (
      cookie.name === SESSION_COOKIE ||
      cookie.name.startsWith(ROLE_SESSION_COOKIE_PREFIX)
    ) {
      store.delete(cookie.name);
    }
  }
}

export async function getSession(
  preferredRoles?: string[],
): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  let payload: jwt.JwtPayload;
  try {
    const decoded = jwt.verify(token, secret());
    if (typeof decoded === "string") return null;
    payload = decoded;
  } catch {
    return null;
  }
  if (!Number.isInteger(payload.id) || typeof payload.role !== "string") return null;

  // Read current assignments so removing a role or disabling an account takes effect immediately.
  const account = await prisma.admin.findUnique({
    where: { admin_id: payload.id },
    select: {
      admin_id: true, admin_name: true, admin_email: true,
      admin_role: true, secondary_roles: true, status: true,
    },
  });
  if (!account || account.status !== "Active") return null;
  const roles = assignedRoles(account);
  const context = roleContext(payload.role, payload.workflow);
  if (!context || !roles.includes(context.role)) return null;
  if (preferredRoles && !preferredRoles.includes(context.role)) return null;
  return {
    id: account.admin_id, name: account.admin_name, email: account.admin_email,
    role: context.role, roles, workflow: context.workflow,
  };
}

export async function requireSession(roles?: string[], workflow?: Workflow) {
  const session = await getSession();
  if (!session) throw new ApiError(401, "Authentication required");
  if (roles && !roles.includes(session.role)) {
    throw new ApiError(403, "Switch to an assigned role that can perform this action");
  }
  if (workflow && session.workflow !== workflow) {
    throw new ApiError(403, "Switch to the selected workflow before performing this action");
  }
  return session;
}

export function requireWorkflow(session: SessionUser, workflow: string) {
  if (session.workflow !== workflow) {
    throw new ApiError(403, "Switch to the selected workflow before performing this action");
  }
}
