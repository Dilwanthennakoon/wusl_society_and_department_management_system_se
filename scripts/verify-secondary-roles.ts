import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

// Run against the local development server. Only temporary test accounts are changed.
const prisma = new PrismaClient();
const base = "http://localhost:3000";
const fixtureIds: number[] = [];
const password = `Test-${randomUUID()}-aA1!`;
const suffix = randomUUID();

class BrowserSession {
  cookies = new Map<string, string>();
  async request(path: string, method = "GET", body?: unknown) {
    const response = await fetch(base + path, {
      method,
      headers: {
        Cookie: [...this.cookies].map(([key, value]) => `${key}=${value}`).join("; "),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(45000),
    });
    for (const cookie of response.headers.getSetCookie()) {
      const [pair] = cookie.split(";");
      const index = pair.indexOf("=");
      const name = pair.slice(0, index);
      const value = pair.slice(index + 1);
      if (value) this.cookies.set(name, value);
      else this.cookies.delete(name);
    }
    return { status: response.status, data: await response.json() };
  }
}

async function verify() {
  const administrator = await prisma.admin.create({
    data: {
      admin_name: "Temporary role test administrator",
      admin_email: `role-test-admin-${suffix}@example.invalid`,
      admin_password: await bcrypt.hash(password, 4),
      admin_role: "System Admin",
    },
  });
  fixtureIds.push(administrator.admin_id);
  const admin = new BrowserSession();
  assert.equal((await admin.request("/api/login", "POST", {
    email: administrator.admin_email, password, role: "System Admin", workflow: "System",
  })).status, 200);

  const email = `role-test-lecturer-${suffix}@example.invalid`;
  const created = await admin.request("/api/admins", "POST", {
    admin_name: "Temporary multi-role lecturer", admin_email: email,
    admin_password: password, admin_role: "Lecturer",
    secondary_roles: ["Department Head", "Department Head", "Lecturer"],
  });
  assert.equal(created.status, 201);
  const id = created.data.admin_id;
  fixtureIds.push(id);
  assert.deepEqual(created.data.secondary_roles, ["Department Head"]);
  assert.equal((await new BrowserSession().request(`/api/admins/${id}`, "PATCH", {
    secondary_roles: ["System Admin"],
  })).status, 401);

  const lecturer = new BrowserSession();
  const login = await lecturer.request("/api/login", "POST", { email, password, workflow: "Department" });
  assert.equal(login.status, 200);
  assert.equal(login.data.user.role, "Lecturer");
  assert.deepEqual(login.data.user.roles, ["Lecturer", "Department Head"]);
  assert.equal(login.data.redirect, "/lecturer");
  assert.equal((await lecturer.request("/api/admins")).status, 403);
  assert.equal((await lecturer.request("/api/session/switch-role", "POST", {
    role: "System Admin", workflow: "System",
  })).status, 403);
  assert.equal((await lecturer.request("/api/session/switch-role", "POST", {
    role: "Lecturer", workflow: "Society",
  })).status, 403);
  console.log("PASS: admin-only assignment, duplicate normalization, primary-role login, unauthorized switches");

  const notice = await prisma.workflowNotification.create({
    data: {
      recipient_admin_id: id, title: "Temporary head notification", message: "Role isolation test",
      notification_type: "role-test", workflow_type: "Department", target_role: "Department Head",
    },
  });
  assert.equal((await lecturer.request("/api/workflow-notifications")).data.notifications.length, 0);
  const switched = await lecturer.request("/api/session/switch-role", "POST", {
    role: "Department Head", workflow: "Department",
  });
  assert.equal(switched.status, 200);
  assert.equal(switched.data.user.id, id);
  assert.equal(switched.data.redirect, "/department-event-head");
  assert.equal((await lecturer.request("/api/session")).data.user.role, "Department Head");
  assert.equal((await lecturer.request("/api/workflow/events?workflow=Department")).status, 200);
  assert.equal((await lecturer.request("/api/workflow/events?workflow=Society")).status, 403);
  assert.equal((await lecturer.request("/api/workflow/events", "POST", {})).status, 403);
  const notifications = await lecturer.request("/api/workflow-notifications");
  assert.equal(notifications.data.notifications[0].workflow_notification_id, notice.workflow_notification_id);
  assert.equal((await lecturer.request("/api/workflow-counts?workflow=Department")).data.role, "Department Head");
  console.log("PASS: role switch preserves identity, changes permissions, and isolates workflow notifications and badges");

  const society = new BrowserSession();
  const societyLogin = await society.request("/api/login", "POST", { email, password, workflow: "Society" });
  assert.equal(societyLogin.status, 200);
  assert.equal(societyLogin.data.user.role, "Department Head");
  assert.equal(societyLogin.data.redirect, "/department-head");
  assert.equal((await society.request("/api/workflow-notifications")).data.notifications.length, 0);

  assert.equal((await admin.request(`/api/admins/${id}`, "PATCH", {
    secondary_roles: ["Department Head", "System Admin"],
  })).status, 200);
  await lecturer.request("/api/session/switch-role", "POST", { role: "Lecturer", workflow: "Department" });
  // A legacy cookie must never silently activate another role, even if that role is assigned.
  lecturer.cookies.set("wusl_session_system_admin", admin.cookies.get("wusl_session")!);
  assert.equal((await lecturer.request("/api/admins")).status, 403);
  assert.equal((await lecturer.request("/api/session/switch-role", "POST", { role: "System Admin", workflow: "System" })).status, 200);
  assert.equal((await lecturer.request("/api/admins")).status, 200);
  assert.equal(lecturer.cookies.has("wusl_session_system_admin"), false);
  console.log("PASS: secondary-role login, explicit permission activation, legacy cookie rejection");

  await lecturer.request("/api/session/switch-role", "POST", { role: "Department Head", workflow: "Department" });
  assert.equal((await admin.request(`/api/admins/${id}`, "PATCH", { secondary_roles: [] })).status, 200);
  assert.equal((await lecturer.request("/api/session")).status, 401);
  assert.equal((await lecturer.request("/api/workflow/events?workflow=Department")).status, 401);
  assert.equal((await lecturer.request("/api/login", "POST", { email, password, workflow: "Department" })).status, 200);
  assert.equal((await admin.request(`/api/admins/${id}`, "PATCH", { secondary_roles: ["Unknown Role"] })).status, 400);
  await admin.request(`/api/admins/${id}`, "PATCH", { status: "Inactive" });
  assert.equal((await lecturer.request("/api/session")).status, 401);
  console.log("PASS: revoked roles and disabled accounts lose access immediately; invalid assignments are rejected");
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  try {
    await prisma.workflowNotification.deleteMany({ where: { recipient_admin_id: { in: fixtureIds } } });
    await prisma.admin.deleteMany({ where: { admin_id: { in: fixtureIds } } });
    console.log("Temporary role test accounts removed.");
  } finally {
    await prisma.$disconnect();
  }
});
