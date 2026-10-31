import { prisma } from "@/lib/prisma";
import { ApiError, apiErrorResponse, parseId } from "@/lib/api";
import { requireSession } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

function safeName(value: string) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").trim() || "budget.pdf";
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await requireSession(["Society Admin", "Treasurer"]);
    const budgetId = parseId((await params).id, "budget ID");
    const budget = await prisma.societyBudget.findUnique({
      where: { budget_id: budgetId },
      select: {
        admin_id: true,
        file_name: true,
        mime_type: true,
        file_size: true,
        file_data: true,
      },
    });
    if (!budget) throw new ApiError(404, "Budget PDF not found");
    if (session.role === "Society Admin" && budget.admin_id !== session.id) {
      throw new ApiError(403, "You can only download your own budgets");
    }

    const body = new ArrayBuffer(budget.file_data.byteLength);
    new Uint8Array(body).set(budget.file_data);

    return new Response(body, {
      headers: {
        "Content-Type": budget.mime_type,
        "Content-Disposition": `attachment; filename="${safeName(budget.file_name)}"`,
        "Content-Length": String(budget.file_size),
      },
    });
  } catch (error) {
    return apiErrorResponse(error, "Failed to download budget PDF");
  }
}
