import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api-urls";

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "bmp",
  "avif",
]);

/**
 * Checks if a given attachment filename or URL is an image.
 */
export function isImageAttachment(fileName: string | null | undefined): boolean {
  if (!fileName) return false;
  const noQuery = fileName.split("?")[0] ?? "";
  const cleanName = noQuery.split("#")[0] ?? "";
  const parts = cleanName.split(".");
  if (parts.length < 2) return false;
  const ext = (parts[parts.length - 1] ?? "").toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

/**
 * Returns the file extension of the attachment.
 */
export function getFileExtension(fileName: string | null | undefined): string {
  if (!fileName) return "";
  const noQuery = fileName.split("?")[0] ?? "";
  const cleanName = noQuery.split("#")[0] ?? "";
  const parts = cleanName.split(".");
  if (parts.length < 2) return "";
  const ext = parts[parts.length - 1] ?? "";
  return ext.toUpperCase();
}

/**
 * Formats the full downloadable/viewable URL for an attachment from the backend API.
 * Files are served at: {API_BASE_URL}/ticket/attachments/{fileName}
 */
export function getAttachmentUrl(fileName: string | null | undefined): string {
  if (!fileName) return "";
  if (fileName.startsWith("http://") || fileName.startsWith("https://") || fileName.startsWith("data:")) {
    return fileName;
  }

  const cleanBase = API_BASE_URL.replace(/\/+$/, "");
  const cleanPath = fileName.replace(/^\/+/, "");

  if (cleanPath.startsWith("ticket/attachments/")) {
    return `${cleanBase}/${cleanPath}`;
  }

  return `${cleanBase}${API_ENDPOINTS.TICKETS.ATTACHMENT_URL(cleanPath)}`;
}
