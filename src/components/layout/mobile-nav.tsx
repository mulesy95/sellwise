"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";

interface MobileNavProps {
  userEmail?: string;
  plan: string;
  used: number;
  limit: number | null;
  inTrial: boolean;
}

export function MobileNav({ userEmail, plan, used, limit, inTrial }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 shadow-xl">
            <Sidebar
              userEmail={userEmail}
              plan={plan}
              used={used}
              limit={limit}
              inTrial={inTrial}
            />
          </div>
        </>
      )}
    </>
  );
}
