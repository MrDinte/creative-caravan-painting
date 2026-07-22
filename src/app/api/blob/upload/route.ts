import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { ACCEPTED_IMAGE_TYPES, isBlobConfigured } from "@/lib/blob";

// Issues short-lived tokens so photos upload straight from the browser to
// Vercel Blob. This bypasses the 4.5 MB server-action body limit, which phone
// photos routinely exceed.
export async function POST(request: Request): Promise<NextResponse> {
  if (!isBlobConfigured()) {
    return NextResponse.json(
      {
        error:
          "Photo storage is not configured. Create a Blob store in the Vercel dashboard.",
      },
      { status: 501 }
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Without this check the upload route would be open to anyone.
        const session = await getAdminSession();
        if (!session) throw new Error("Not authenticated");

        return {
          allowedContentTypes: [...ACCEPTED_IMAGE_TYPES],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ author: session.name }),
        };
      },
      onUploadCompleted: async () => {
        // Intentionally empty. This webhook cannot reach localhost, so the
        // browser sends the returned URL back with the update form instead —
        // that path works identically in development and production.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      JSON.stringify({
        level: "error",
        msg: "blob upload token failed",
        route: "/api/blob/upload",
        error: message,
        requestId: request.headers.get("x-vercel-id"),
      })
    );
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
