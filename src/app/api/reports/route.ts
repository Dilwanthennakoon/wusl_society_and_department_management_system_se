import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reports = await prisma.reporting.findMany({
      include: {
        admin: true,
        report_tasks: {
          include: {
            task: true,
          },
        },
        attachments: true,
      },
      orderBy: {
        report_id: "desc",
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("GET reports error:", error);

    return NextResponse.json(
      { message: "Failed to fetch reports" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const report = await prisma.reporting.create({
      data: {
        admin_id: Number(body.admin_id),
        report_title: body.report_title,
        report_type: body.report_type,
        report_description: body.report_description,
        generated_date: body.generated_date
          ? new Date(body.generated_date)
          : new Date(),
        report_status: body.report_status || "Generated",

        report_tasks: body.task_ids
          ? {
              create: body.task_ids.map((taskId: number) => ({
                task_id: Number(taskId),
                remarks: body.task_remarks || null,
              })),
            }
          : undefined,

      },
      include: {
        admin: true,
        report_tasks: {
          include: {
            task: true,
          },
        },
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("POST report error:", error);

    return NextResponse.json(
      { message: "Failed to create report" },
      { status: 500 },
    );
  }
}
