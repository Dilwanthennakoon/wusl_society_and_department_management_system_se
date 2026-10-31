import { Prisma } from "@prisma/client";
import { z } from "zod";
import { ApiError } from "@/lib/api";

export const SOCIETY_APPLICATION_ROLES = [
  "Society Admin",
  "Treasurer",
  "Registrar",
  "Student Counsellor",
  "Department Head",
  "Dean",
  "Vice-Chancellor",
];

const jsonValue = z
  .union([z.array(z.unknown()), z.record(z.string(), z.unknown())])
  .optional()
  .nullable();

const nullableString = z.string().trim().optional().nullable();
const nullableDate = z.preprocess(
  (value) => (value ? value : null),
  z.coerce.date().nullable(),
);

export const societyApplicationSchema = z.object({
  application_type: z.enum(["New Society", "Renewal"]),
  society_id: z.coerce.number().int().positive().optional().nullable(),
  academic_year: z.string().trim().min(1),
  society_name: z.string().trim().min(2),
  communication_address: nullableString,
  constitution_enforced_date: nullableDate,
  constitution_annex_note: nullableString,
  bank_account_no: nullableString,
  agm_date: nullableDate,
  senior_treasurer_name: nullableString,
  senior_treasurer_designation: nullableString,
  senior_treasurer_department: nullableString,
  new_office_bearers: jsonValue,
  new_committee_members: jsonValue,
  previous_office_bearers: jsonValue,
  previous_committee_members: jsonValue,
  active_members_count: z.coerce
    .number()
    .int()
    .nonnegative()
    .optional()
    .nullable(),
  members_annex_note: nullableString,
  previous_year_activities: nullableString,
  other_activities: nullableString,
  difficulties_and_solutions: nullableString,
  proposed_activity_plan: jsonValue,
  president_signature: nullableString,
  secretary_signature: nullableString,
  certification_date: nullableDate,
  certification_secretary_signature: nullableString,
});

type PersonRow = {
  position?: unknown;
  name?: unknown;
  reg_no?: unknown;
  signature?: unknown;
};

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function assertNotPast(date: Date | null | undefined, label: string) {
  if (date && date < startOfToday()) {
    throw new ApiError(400, `${label} cannot be a previous date`);
  }
}

function validatePersonRows(value: unknown, label: string) {
  if (!Array.isArray(value)) return;

  for (const [index, row] of (value as PersonRow[]).entries()) {
    const regNo = typeof row.reg_no === "string" ? row.reg_no.trim() : "";
    if (regNo && !/^[A-Za-z0-9/-]+$/.test(regNo)) {
      throw new ApiError(
        400,
        `${label} row ${index + 1} registration number can only contain letters, numbers, slash, or hyphen`,
      );
    }
  }
}

export function applicationInclude() {
  return {
    society: true,
    admin: {
      select: {
        admin_id: true,
        admin_name: true,
        admin_email: true,
        admin_role: true,
      },
    },
    reviews: {
      include: {
        admin: {
          select: { admin_name: true, admin_role: true },
        },
      },
      orderBy: { reviewed_at: "desc" as const },
    },
  };
}

export function validateApplicationPayload(
  data: z.infer<typeof societyApplicationSchema>,
) {
  if (data.application_type === "Renewal" && !data.society_id) {
    throw new ApiError(400, "Select the existing society for renewal");
  }
  if (data.application_type === "New Society" && data.society_id) {
    throw new ApiError(
      400,
      "New society applications cannot select an existing society",
    );
  }
  assertNotPast(data.certification_date, "Certification date");
  validatePersonRows(data.new_office_bearers, "New office bearers");
  validatePersonRows(data.new_committee_members, "New committee members");
  validatePersonRows(data.previous_office_bearers, "Previous office bearers");
  validatePersonRows(
    data.previous_committee_members,
    "Previous committee members",
  );
}

export function toJson(value: unknown) {
  return (value as Prisma.InputJsonValue | null | undefined) ?? Prisma.JsonNull;
}
