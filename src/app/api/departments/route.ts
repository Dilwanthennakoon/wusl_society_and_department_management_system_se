import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: {
        department_id: "desc",
      },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error("GET departments error:", error);

    return NextResponse.json(
      { message: "Failed to fetch departments" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { department_name, department_code, faculty, description, status } =
      body;

    if (!department_name) {
      return NextResponse.json(
        { message: "Department name is required" },
        { status: 400 },
      );
    }

    const department = await prisma.department.create({
      data: {
        department_name,
        department_code: department_code || null,
        faculty: faculty || null,
        description: description || null,
        status: status || "Active",
      },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error("POST department error:", error);

    return NextResponse.json(
      { message: "Failed to create department" },
      { status: 500 },
    );
  }
}
