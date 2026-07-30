"use server";

import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "mbc-media";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

/**
 * Stores a staff-uploaded image and returns its public URL. The extension is
 * derived from the validated MIME type rather than the client-supplied
 * filename, so a crafted name can't control the stored object's path.
 */
export async function uploadImage(
  file: File,
  folder: string
): Promise<string> {
  await requireStaff();

  if (!ALLOWED.has(file.type)) {
    throw new Error("Image must be a JPEG, PNG, WebP or AVIF file");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller");
  }

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(error.message);

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
