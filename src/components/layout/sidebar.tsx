"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Search,
  Eye,
  BarChart3,
  Settings,
  LayoutDashboard,
  LogOut,
  Store,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/lib/supabase/actions";
import { UsageBar } from "@/components/layout/usage-bar";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Optimiser", href: "/dashboard/optimise", icon: Sparkles, badge: "Core" },
  { label: "Keywords", href: "/dashboard/keywords", icon: Search },
  { label: "Competitor", href: "/dashboard/competitor", icon: Eye },
  { label: "Audit", href: "/dashboard/audit", icon: BarChart3 },
  { label: "My Shop", href: "/dashboard/shop", icon: Store },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({
  userEmail,
  plan = "free",
  used = 0,
  limit = 3,
  inTrial = false,
  isAdmin = false,
}: {
  userEmail?: string;
  plan?: string;
  used?: number;
  limit?: number | null;
  inTrial?: boolean;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const allNavItems = [
    ...navItems,
    ...(isAdmin ? [{ label: "Admin", href: "/dashboard/admin", icon: ShieldCheck }] : []),
  ];

  return (
    <aside className="flex h-full w-56 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <span className="text-lg font-bold tracking-tight">
          Sell<span className="text-primary">Wise</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {allNavItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge
                  variant="outline"
                  className="h-4 rounded px-1 py-0 text-[10px] text-primary border-primary/30"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Usage footer */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <UsageBar initialUsed={used} initialLimit={limit} plan={plan} inTrial={inTrial} />

        {/* User + sign out */}
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="truncate text-xs text-muted-foreground">
            {userEmail ?? "—"}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              title="Sign out"
              className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <LogOut className="size-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
