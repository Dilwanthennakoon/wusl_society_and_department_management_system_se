import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, apiErrorResponse } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import {
  createWorkflowNotificationForRole,
  createWorkflowNotifications,
} from "@/lib/workflow-notifications";

const MAX_BUDGET_FILE_SIZE = 10 * 1024 * 1024;

const uploadSchema = z.object({
  society_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(2),
  academic_year: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

const approvalSchema = z.object({
  budget_id: z.coerce.number().int().positive(),
});

function budgetSelect() {
  return {
    budget_id: true,
    society_id: true,
    admin_id: true,
    approved_by_admin_id: true,
    title: true,
    academic_year: true,
    notes: true,
    file_name: true,
    mime_type: true,
    file_size: true,
    budget_status: true,
    submitted_at: true,
    approved_at: true,
    created_at: true,
    society: {
      select: {
        society_id: true,
        society_name: true,
        society_short_name: true,
      },
    },
    admin: {
      select: {
        admin_name: true,
        admin_email: true,
      },
    },
    approved_by: {
      select: {
        admin_name: true,
      },
    },
  };
}

export async function GET() {
  try {
    const session = await requireSession(["Society Admin", "Treasurer"]);

    const budgets = await prisma.societyBudget.findMany({
      where:
        session.role === "Society Admin" ? { admin_id: session.id } : undefined,
      select: budgetSelect(),
      orderBy: { submitted_at: "desc" },
    });

    return NextResponse.json(budgets);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch finance budgets");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(["Society Admin"]);
    const formData = await request.formData();
    const data = uploadSchema.parse({
      society_id: formData.get("society_id"),
      title: formData.get("title"),
      academic_year: formData.get("academic_year") || null,
      notes: formData.get("notes") || null,
    });
    const file = formData.get("budget_pdf");

    if (!(file instanceof File)) {
      throw new ApiError(400, "Upload a budget PDF");
    }
    if (file.type !== "application/pdf") {
      throw new ApiError(400, "Only PDF budget files are allowed");
    }
    if (file.size > MAX_BUDGET_FILE_SIZE) {
      throw new ApiError(400, "Budget PDF must be 10 MB or smaller");
    }

    const budget = await prisma.societyBudget.create({
      data: {
        society_id: data.society_id,
        admin_id: session.id,
        title: data.title,
        academic_year: data.academic_year || null,
        notes: data.notes || null,
        file_name: file.name || "budget.pdf",
        mime_type: file.type,
        file_size: file.size,
        file_data: Buffer.from(await file.arrayBuffer()),
        budget_status: "Pending Treasurer Approval",
      },
      select: budgetSelect(),
    });

    await createWorkflowNotificationForRole("Treasurer", {
      actorId: session.id,
      title: "Budget waiting for approval",
      message: `${budget.title} for ${budget.society.society_name} is ready for Treasurer approval.`,
      notificationType: "finance-budget-approval-request",
      workflowType: "Society",
      actionUrl: "/treasurer#finance",
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to upload finance budget");
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession(["Treasurer"]);
    const data = approvalSchema.parse(await request.json());
    const existing = await prisma.societyBudget.findUnique({
      where: { budget_id: data.budget_id },
      select: {
        budget_id: true,
        admin_id: true,
        title: true,
        budget_status: true,
        society: { select: { society_name: true } },
      },
    });
    if (!existing) throw new ApiError(404, "Budget not found");
    if (existing.budget_status === "Approved") {
      throw new ApiError(409, "This budget is already approved");
    }

    const budget = await prisma.societyBudget.update({
      where: { budget_id: data.budget_id },
      data: {
        budget_status: "Approved",
        approved_by_admin_id: session.id,
        approved_at: new Date(),
      },
      select: budgetSelect(),
    });

    await createWorkflowNotifications([existing.admin_id], {
      targetRole: "Society Admin",
      actorId: session.id,
      title: "Budget approved",
      message: `${existing.title} for ${existing.society.society_name} was approved by the Treasurer.`,
      notificationType: "finance-budget-approved",
      workflowType: "Society",
      actionUrl: "/society-admin#finance",
    });

    return NextResponse.json(budget);
  } catch (error) {
    return apiErrorResponse(error, "Failed to approve finance budget");
  }
}
