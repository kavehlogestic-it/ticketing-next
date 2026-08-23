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
 * Formats the downloadable/viewable URL for an attachment.
 * When client devices cannot directly access the internal backend file server
 * (e.g. 192.168.77.30:6040), files are streamed through the Next.js server proxy:
 * `/api/attachments/{fileName}`.
 */
export function getAttachmentUrl(fileName: string | null | undefined): string {
  if (!fileName) return "";
  if (fileName.startsWith("data:") || fileName.startsWith("blob:")) {
    return fileName;
  }

  let cleanPath = fileName;
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    try {
      const parsed = new URL(cleanPath);
      cleanPath = parsed.pathname;
    } catch {
      // ignore
    }
  }

  cleanPath = cleanPath.replace(/^\/+/, "");
  if (cleanPath.startsWith("ticketAttachments/")) {
    cleanPath = cleanPath.replace(/^ticketAttachments\//, "");
  }

  return `/api/attachments/${encodeURIComponent(cleanPath)}`;
}
