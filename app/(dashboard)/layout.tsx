import Sidebar from "@/components/Sidebar";
import { requireStaff } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, fullName, user } = await requireStaff();

  return (
    <div className="lg:flex">
      <Sidebar role={role} fullName={fullName} email={user.email ?? ""} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
