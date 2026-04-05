import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="admin-theme flex min-h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="admin-main flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className="page-shell-full min-h-full pb-10 pt-5 lg:pb-12 lg:pt-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
