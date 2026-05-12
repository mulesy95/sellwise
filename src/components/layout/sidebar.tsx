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
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Optimiser",
    href: "/dashboard/optimise",
    icon: Sparkles,
    badge: "Core",
  },
  {
    label: "Keywords",
    href: "/dashboard/keywords",
    icon: Search,
  },
  {
    label: "Competitor",
    href: "/dashboard/competitor",
    icon: Eye,
  },
  {
    label: "Audit",
    href: "/dashboard/audit",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Zap className="size-4" />
        </div>
        <span className="font-bold tracking-tight">
          Sell<span className="text-primary">wise</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
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
      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-md bg-sidebar-accent/50 p-3 text-xs">
          <div className="mb-1.5 flex items-center justify-between font-medium">
            <span>Free plan</span>
            <span className="text-muted-foreground">0 / 3 used</span>
          </div>
          <div className="h-1.5 rounded-full bg-sidebar-border">
            <div className="h-full w-0 rounded-full bg-primary transition-all" />
          </div>
          <Link
            href="/dashboard/settings"
            className="mt-2 block text-center text-primary hover:underline"
          >
            Upgrade →
          </Link>
        </div>
      </div>
    </aside>
  );
}
