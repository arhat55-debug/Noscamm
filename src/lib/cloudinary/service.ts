import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from "cloudinary";

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are not configured.");
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
}

type UploadedAsset = Pick<UploadApiResponse, "secure_url" | "public_id" | "resource_type" | "width" | "height">;

export async function uploadFileToCloudinary(
  file: File,
  options: UploadApiOptions & { folder: string },
): Promise<UploadedAsset> {
  configureCloudinary();

  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        ...options,
        resource_type: options.resource_type ?? "auto",
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
          width: result.width,
          height: result.height,
        });
      },
    );

    stream.end(buffer);
  });
}

export function buildCloudinaryTransformUrl(url: string, transform: string) {
  if (!url.includes("/upload/")) {
    return url;
  }

  return url.replace("/upload/", `/upload/${transform}/`);
}

export function buildListingImageUrl(url: string) {
  return buildCloudinaryTransformUrl(url, "c_fill,ar_4:3,w_1200,q_auto:good,f_auto");
}

export function buildListingThumbnailUrl(url: string) {
  return buildCloudinaryTransformUrl(url, "c_fill,ar_4:3,w_480,q_auto:eco,f_auto");
}

export function validateUploadFile(file: File, maxBytes: number, allowedTypes: string[]) {
  if (!file || file.size === 0) {
    throw new Error("A file is required.");
  }

  if (file.size > maxBytes) {
    throw new Error("The selected file is too large.");
  }

  if (!allowedTypes.some((type) => file.type === type || file.type.startsWith(type))) {
    throw new Error("Unsupported file type.");
  }
}
