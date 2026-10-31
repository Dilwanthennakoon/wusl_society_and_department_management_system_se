import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function parseId(value: string, label = "ID") {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `Invalid ${label}`);
  }

  return id;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function apiErrorResponse(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "Invalid request data",
        errors: error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "A record with these unique details already exists" },
        { status: 409 },
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        { message: "A related record does not exist or is still in use" },
        { status: 409 },
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json({ message: "Record not found" }, { status: 404 });
    }
  }

  console.error(fallback, error);
  return NextResponse.json({ message: fallback }, { status: 500 });
}

