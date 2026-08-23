import { type NextRequest, NextResponse } from "next/server";

import { API_BASE_URL } from "@/constants/api-urls";
import { getAccessToken } from "@/lib/auth/token-store";

type Props = {
  params: Promise<{ path: string[] }>;
};

/**
 * File Attachment Proxy Handler.
 * When client browsers cannot directly reach the internal backend file server
 * (e.g. http://192.168.77.30:6040/ticketAttachments/...), this route streams
 * the file from the internal server to the client securely.
 */
export async function GET(request: NextRequest, { params }: Props) {
  const { path } = await params;
  if (!path || path.length === 0) {
    return new NextResponse("File path not specified", { status: 400 });
  }

  const fullPath = path.map(decodeURIComponent).join("/");
  const cleanFileName = fullPath.replace(/^ticketAttachments\//, "");
  const token = await getAccessToken();

  const targetUrl = `${API_BASE_URL.replace(/\/+$/, "")}/ticketAttachments/${encodeURI(cleanFileName)}`;

  try {
    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    // Forward range header if browser requests partial content
    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      headers.set("range", rangeHeader);
    }

    const response = await fetch(targetUrl, {
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      return new NextResponse(`File not found or inaccessible (${response.status})`, {
        status: response.status,
      });
    }

    const responseHeaders = new Headers();
    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");
    const contentDisposition = response.headers.get("content-disposition");
    const acceptRanges = response.headers.get("accept-ranges");

    if (contentType) responseHeaders.set("Content-Type", contentType);
    if (contentLength) responseHeaders.set("Content-Length", contentLength);
    if (contentDisposition) {
      responseHeaders.set("Content-Disposition", contentDisposition);
    } else {
      const baseName = path[path.length - 1] ?? "attachment";
      responseHeaders.set(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(baseName)}"`,
      );
    }
    if (acceptRanges) responseHeaders.set("Accept-Ranges", acceptRanges);

    responseHeaders.set("Cache-Control", "private, max-age=3600");

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("Error proxying attachment file:", err);
    return new NextResponse("Internal server error fetching attachment", { status: 500 });
  }
}
