"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";

interface Props {
  children: React.ReactNode;
}

export function AdminGate({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setChecked(true);
      setAuthed(true);
      return;
    }
    const ok = isAdminAuthed();
    if (!ok) {
      router.replace("/admin/login");
      return;
    }
    setAuthed(true);
    setChecked(true);
  }, [pathname, router]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-radial-atmosphere flex items-center justify-center">
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">
          Verifying access…
        </span>
      </div>
    );
  }

  if (!authed) return null;

  return <>{children}</>;
}
