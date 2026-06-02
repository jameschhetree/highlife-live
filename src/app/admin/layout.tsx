"use client";

import { usePathname } from "next/navigation";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AdminGate>
      <div className="min-h-screen flex bg-[#05060a]">
        <AdminSidebar />
        <main className="flex-1 min-w-0 pt-14 lg:pt-0">{children}</main>
      </div>
    </AdminGate>
  );
}
