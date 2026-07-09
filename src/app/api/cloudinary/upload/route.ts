import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { uploadFileToCloudinary, validateUploadFile } from "@/lib/cloudinary/service";
import { rateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireUser();
    const limiter = rateLimit(`upload:${user.id}`, 30, 60_000);

    if (!limiter.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const purpose = String(formData.get("purpose") ?? "listing");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const privatePurpose = purpose === "kyc";
    validateUploadFile(file, privatePurpose ? 60_000_000 : 8_000_000, privatePurpose ? ["image/", "video/"] : ["image/"]);

    const uploaded = await uploadFileToCloudinary(file, {
      folder: `nexus/${purpose}/${user.id}`,
      type: privatePurpose ? "authenticated" : "upload",
      resource_type: "auto",
    });

    return NextResponse.json({ url: uploaded.secure_url, publicId: uploaded.public_id, resourceType: uploaded.resource_type });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: message.includes("NEXT_REDIRECT") ? 401 : 500 });
  }
}
