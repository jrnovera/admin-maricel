import Sidebar from "@/components/Sidebar";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function getUnreadEnquiryCount() {
  const { count } = await createAdminClient()
    .from("mbc_enquiries")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  return count ?? 0;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, fullName, user } = await requireStaff();
  const unreadCount = await getUnreadEnquiryCount();

  return (
    <div className="lg:flex">
      <Sidebar
        role={role}
        fullName={fullName}
        email={user.email ?? ""}
        unreadCount={unreadCount}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
