import { ApiError } from "@/lib/api";

export const MAX_MEDIA_FILE_SIZE = 20 * 1024 * 1024;
export const MAX_MEDIA_FILES = 12;

export type StoredMedia = {
  file_name: string;
  media_type: "Image" | "Video";
  mime_type: string;
  file_size: number;
  file_data: Buffer;
};

export async function parseMediaFiles(formData: FormData) {
  const photoFiles = formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const videoFiles = formData
    .getAll("videos")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const files = [
    ...photoFiles.map((file) => ({ file, media_type: "Image" as const })),
    ...videoFiles.map((file) => ({ file, media_type: "Video" as const })),
  ];

  if (files.length > MAX_MEDIA_FILES) {
    throw new ApiError(400, `A maximum of ${MAX_MEDIA_FILES} media files is allowed`);
  }

  const stored: StoredMedia[] = [];
  for (const item of files) {
    if (item.file.size > MAX_MEDIA_FILE_SIZE) {
      throw new ApiError(
        400,
        `${item.file.name} exceeds the 20 MB per-file limit`,
      );
    }
    if (
      item.media_type === "Image" &&
      !item.file.type.startsWith("image/")
    ) {
      throw new ApiError(400, `${item.file.name} is not a valid image`);
    }
    if (
      item.media_type === "Video" &&
      !item.file.type.startsWith("video/")
    ) {
      throw new ApiError(400, `${item.file.name} is not a valid video`);
    }
    stored.push({
      file_name: item.file.name,
      media_type: item.media_type,
      mime_type: item.file.type,
      file_size: item.file.size,
      file_data: Buffer.from(await item.file.arrayBuffer()),
    });
  }
  return stored;
}

export function assertCompleteMedia(
  media: { media_type: string }[],
  message = "At least one photo and one video are required",
) {
  const hasPhoto = media.some((item) => item.media_type === "Image");
  const hasVideo = media.some((item) => item.media_type === "Video");
  if (!hasPhoto || !hasVideo) throw new ApiError(400, message);
}

