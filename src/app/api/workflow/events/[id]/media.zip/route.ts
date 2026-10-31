import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
import { ApiError, apiErrorResponse, parseId } from "@/lib/api";
import { requireSession } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

function safeName(value: string) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").trim() || "event";
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireSession([
      "Society Admin",
      "Treasurer",
      "Registrar",
      "Student Counsellor",
      "Department Head",
      "Dean",
      "Vice-Chancellor",
      "Faculty Web Coordinator",
      "Lecturer",
    ]);
    const eventId = parseId((await params).id, "event ID");
    const event = await prisma.event.findUnique({
      where: { event_id: eventId },
      include: {
        images: {
          select: {
            file_name: true,
            media_type: true,
            file_data: true,
          },
        },
      },
    });
    if (!event) throw new ApiError(404, "Event not found");
    const media = event.images.filter((item) => item.file_data);
    if (media.length === 0) {
      throw new ApiError(404, "No downloadable event media found");
    }

    const zip = new JSZip();
    const usedNames = new Set<string>();
    for (const [index, item] of media.entries()) {
      const folder = item.media_type === "Video" ? "videos" : "photos";
      let name = safeName(item.file_name || `${item.media_type}-${index + 1}`);
      if (usedNames.has(`${folder}/${name}`)) {
        name = `${index + 1}-${name}`;
      }
      usedNames.add(`${folder}/${name}`);
      zip.file(`${folder}/${name}`, item.file_data!);
    }
    const content = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
    const body = new ArrayBuffer(content.byteLength);
    new Uint8Array(body).set(content);
    const filename = `${safeName(event.event_name)}-media.zip`;
    return new Response(body, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(content.byteLength),
      },
    });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create event media ZIP");
  }
}
