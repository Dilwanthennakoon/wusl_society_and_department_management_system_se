import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const workflowPassword = "123456";

const accounts = [
  ["System Administrator", "systemadmin@wusl.lk", "System Admin", workflowPassword],
  [
    "Society Administrator",
    "societyadmin@wusl.lk",
    "Society Admin",
    workflowPassword,
  ],
  ["Student User", "student@wusl.lk", "Student", workflowPassword],
  ["Society Treasurer", "treasurer@wusl.lk", "Treasurer", workflowPassword],
  ["Registrar", "registrar@wusl.lk", "Registrar", workflowPassword],
  [
    "Student Counsellor",
    "counsellor@wusl.lk",
    "Student Counsellor",
    workflowPassword,
  ],
  [
    "Department Head",
    "departmenthead@wusl.lk",
    "Department Head",
    workflowPassword,
  ],
  ["Dean", "dean@wusl.lk", "Dean", workflowPassword],
  [
    "Vice-Chancellor",
    "vicechancellor@wusl.lk",
    "Vice-Chancellor",
    workflowPassword,
  ],
  [
    "Faculty Web Coordinator",
    "webcoordinator@wusl.lk",
    "Faculty Web Coordinator",
    workflowPassword,
  ],
  ["Department Lecturer", "lecturer@wusl.lk", "Lecturer", workflowPassword],
] as const;

const departments = [
  ["CIS", "Computing & Information Systems"],
  ["IM", "Industrial Management"],
  ["MATH", "Mathematics"],
  ["ELEC", "Electronics"],
] as const;

async function main() {
  for (const [admin_name, admin_email, admin_role, password] of accounts) {
    const admin_password = await bcrypt.hash(password, 12);
    await prisma.admin.upsert({
      where: { admin_email },
      update: {
        admin_name,
        admin_password,
        admin_role,
        status: "Active",
      },
      create: {
        admin_name,
        admin_email,
        admin_password,
        admin_role,
        status: "Active",
      },
    });
  }

  for (const [department_code, department_name] of departments) {
    await prisma.department.upsert({
      where: { department_name },
      update: { department_code, status: "Active" },
      create: { department_code, department_name, status: "Active" },
    });
  }

  console.log("Presentation seed completed successfully");
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
