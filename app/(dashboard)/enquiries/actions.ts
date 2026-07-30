"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function setEnquiryRead(id: string, isRead: boolean) {
  await requireStaff();

  const { error } = await createAdminClient()
    .from("mbc_enquiries")
    .update({ is_read: isRead })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/enquiries");
  revalidatePath("/");
}

export async function deleteEnquiry(id: string) {
  await requireAdmin();

  const { error } = await createAdminClient()
    .from("mbc_enquiries")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/enquiries");
  revalidatePath("/");
}
