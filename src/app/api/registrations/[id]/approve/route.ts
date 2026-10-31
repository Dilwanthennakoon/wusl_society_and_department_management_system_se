import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const registrationId = Number(id);

    if (isNaN(registrationId)) {
      return NextResponse.json(
        { message: "Invalid registration ID" },
        { status: 400 },
      );
    }

    const registration = await prisma.registration.findUnique({
      where: {
        registration_id: registrationId,
      },
      include: {
        membership: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { message: "Registration not found" },
        { status: 404 },
      );
    }

    if (registration.membership) {
      return NextResponse.json(
        { message: "Membership already created for this registration" },
        { status: 400 },
      );
    }

    const updatedRegistration = await prisma.registration.update({
      where: {
        registration_id: registrationId,
      },
      data: {
        status: "Approved",
      },
    });

    const membership = await prisma.membership.create({
      data: {
        registration_id: registration.registration_id,
        society_id: registration.society_id,
        student_name: registration.student_name,
        student_index_no: registration.student_index_no,
        student_email: registration.student_email,
        member_role: "Member",
        membership_status: "Active",
      },
    });

    return NextResponse.json({
      message: "Registration approved and membership created",
      data: {
        registration: updatedRegistration,
        membership: membership,
      },
    });
  } catch (error) {
    console.error("Approve registration error:", error);

    return NextResponse.json(
      { message: "Failed to approve registration" },
      { status: 500 },
    );
  }
}
