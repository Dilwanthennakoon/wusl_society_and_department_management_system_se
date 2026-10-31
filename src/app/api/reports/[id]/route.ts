import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const reportId = Number(id);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { message: "Invalid report ID" },
        { status: 400 },
      );
    }

    const report = await prisma.reporting.findUnique({
      where: {
        report_id: reportId,
      },
      include: {
        admin: true,
        report_tasks: {
          include: {
            task: {
              include: {
                event: true,
              },
            },
          },
        },
        attachments: true,
      },
    });

    if (!report) {
      return NextResponse.json(
        { message: "Report not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("GET report error:", error);

    return NextResponse.json(
      { message: "Failed to fetch report" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const reportId = Number(id);
    const body = await request.json();

    if (isNaN(reportId)) {
      return NextResponse.json(
        { message: "Invalid report ID" },
        { status: 400 },
      );
    }

    const report = await prisma.reporting.update({
      where: {
        report_id: reportId,
      },
      data: {
        admin_id: body.admin_id ? Number(body.admin_id) : undefined,
        report_title: body.report_title,
        report_type: body.report_type,
        report_description: body.report_description,
        generated_date: body.generated_date
          ? new Date(body.generated_date)
          : undefined,
        report_status: body.report_status,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("PATCH report error:", error);

    return NextResponse.json(
      { message: "Failed to update report" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const reportId = Number(id);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { message: "Invalid report ID" },
        { status: 400 },
      );
    }

    await prisma.reportTask.deleteMany({
      where: {
        report_id: reportId,
      },
    });

    await prisma.reportAttachment.deleteMany({
      where: {
        report_id: reportId,
      },
    });

    await prisma.reporting.delete({
      where: {
        report_id: reportId,
      },
    });

    return NextResponse.json({
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("DELETE report error:", error);

    return NextResponse.json(
      { message: "Failed to delete report" },
      { status: 500 },
    );
  }
}
