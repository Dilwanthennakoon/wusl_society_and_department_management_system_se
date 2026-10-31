import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const members = await prisma.membership.findMany({
      include: {
        society: true,
        registration: true,
        event_members: {
          include: {
            event: true,
          },
        },
        task_assignments: {
          include: {
            task: true,
          },
        },
      },
      orderBy: {
        membership_id: "desc",
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("GET members error:", error);

    return NextResponse.json(
      { message: "Failed to fetch members" },
      { status: 500 },
    );
  }
}
