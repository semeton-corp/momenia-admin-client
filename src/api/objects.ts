import { apiClient } from "@/api/http-client";

export type ObjectCategory =
  | "landing-page"
  | "avatar"
  | "invitation-template"
  | "content-invitation-template"
  | "other";

export type PresignedUploadRequest = {
  category: ObjectCategory;
  contentType: string;
  metadata: {
    originalName: string;
    size: string;
    uploadAt: string;
  };
};

export type PresignedUploadResponse = {
  presignedUrl: string;
  key: string;
  acl: string;
  contentDisposition: string;
  contentType: string;
  metadata: {
    originalName: string;
    size: string;
    uploadAt: string;
  };
};

export function getPresignedUploadUrl(payload: PresignedUploadRequest) {
  return apiClient.post<PresignedUploadResponse>("/api/v1/objects", payload);
}

export async function uploadObjectToPresignedUrl(
  file: File,
  presignedUpload: PresignedUploadResponse,
) {
  const response = await fetch(presignedUpload.presignedUrl, {
    method: "PUT",
    headers: {
      "content-disposition": presignedUpload.contentDisposition,
      "x-amz-acl": presignedUpload.acl,
      "x-amz-meta-originalname": presignedUpload.metadata.originalName,
      "x-amz-meta-size": presignedUpload.metadata.size,
      "x-amz-meta-uploadat": presignedUpload.metadata.uploadAt,
    },
    body: file,
  });

  if (!response.ok) {
    const text = await response.text(); 
    console.error("UPLOAD ERROR:", text);
    throw new Error(`Upload failed: ${response.status}`);
  }
}

export async function uploadObjectWithPresignedUrl(
  file: File,
  category: ObjectCategory,
) {
  const presignedUpload = await getPresignedUploadUrl({
    category,
    contentType: file.type || "application/octet-stream",
    metadata: {
      originalName: file.name,
      size: String(file.size),
      uploadAt: new Date().toISOString(),
    },
  });

  await uploadObjectToPresignedUrl(file, presignedUpload);

  return presignedUpload;
}
