import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const department = await prisma.department.findUnique({
      where: {
        department_id: Number(id),
      },
    });

    if (!department) {
      return NextResponse.json(
        { message: "Department not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(department);
  } catch (error) {
    console.error("GET department by id error:", error);

    return NextResponse.json(
      { message: "Failed to fetch department" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { department_name, department_code, faculty, description, status } =
      body;

    if (!department_name) {
      return NextResponse.json(
        { message: "Department name is required" },
        { status: 400 },
      );
    }

    const department = await prisma.department.update({
      where: {
        department_id: Number(id),
      },
      data: {
        department_name,
        department_code: department_code || null,
        faculty: faculty || null,
        description: description || null,
        status: status || "Active",
      },
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error("PATCH department error:", error);

    return NextResponse.json(
      { message: "Failed to update department" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await prisma.department.delete({
      where: {
        department_id: Number(id),
      },
    });

    return NextResponse.json({
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("DELETE department error:", error);

    return NextResponse.json(
      { message: "Failed to delete department" },
      { status: 500 },
    );
  }
}
