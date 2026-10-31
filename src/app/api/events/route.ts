import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
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
      orderBy: {
        event_id: "desc",
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("GET events error:", error);

    return NextResponse.json(
      { message: "Failed to fetch events" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const event = await prisma.event.create({
      data: {
        society_id: Number(body.society_id),
        admin_id: Number(body.admin_id),
        event_name: body.event_name,
        event_description: body.event_description,
        event_type: body.event_type,
        event_date: body.event_date ? new Date(body.event_date) : null,
        start_time: body.start_time ? new Date(body.start_time) : null,
        end_time: body.end_time ? new Date(body.end_time) : null,
        venue: body.venue,
        event_status: body.event_status || "Planned",
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("POST event error:", error);

    return NextResponse.json(
      { message: "Failed to create event" },
      { status: 500 },
    );
  }
}
