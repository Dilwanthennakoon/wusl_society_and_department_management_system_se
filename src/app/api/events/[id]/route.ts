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
    const eventId = Number(id);

    if (isNaN(eventId)) {
      return NextResponse.json(
        { message: "Invalid event ID" },
        { status: 400 },
      );
    }

    const event = await prisma.event.findUnique({
      where: {
        event_id: eventId,
      },
      include: {
        society: true,
        admin: true,
        event_members: {
          include: {
            membership: true,
          },
        },
        tasks: true,
        images: {
          select: {
            image_id: true,
            file_name: true,
            media_type: true,
            mime_type: true,
            file_size: true,
            uploaded_at: true,
          },
        },
        sponsors: true,
      },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("GET event error:", error);

    return NextResponse.json(
      { message: "Failed to fetch event" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const eventId = Number(id);
    const body = await request.json();

    if (isNaN(eventId)) {
      return NextResponse.json(
        { message: "Invalid event ID" },
        { status: 400 },
      );
    }

    const event = await prisma.event.update({
      where: {
        event_id: eventId,
      },
      data: {
        society_id: body.society_id ? Number(body.society_id) : undefined,
        admin_id: body.admin_id ? Number(body.admin_id) : undefined,
        event_name: body.event_name,
        event_description: body.event_description,
        event_type: body.event_type,
        event_date: body.event_date ? new Date(body.event_date) : undefined,
        start_time: body.start_time ? new Date(body.start_time) : undefined,
        end_time: body.end_time ? new Date(body.end_time) : undefined,
        venue: body.venue,
        event_status: body.event_status,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("PATCH event error:", error);

    return NextResponse.json(
      { message: "Failed to update event" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const eventId = Number(id);

    if (isNaN(eventId)) {
      return NextResponse.json(
        { message: "Invalid event ID" },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.eventReview.deleteMany({ where: { event_id: eventId } }),
      prisma.eventImage.deleteMany({ where: { event_id: eventId } }),
      prisma.eventSponsor.deleteMany({ where: { event_id: eventId } }),
      prisma.eventMember.deleteMany({ where: { event_id: eventId } }),
      prisma.event.delete({ where: { event_id: eventId } }),
    ]);

    return NextResponse.json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("DELETE event error:", error);

    return NextResponse.json(
      { message: "Failed to delete event" },
      { status: 500 },
    );
  }
}
