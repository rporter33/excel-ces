// src/components/bottom-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, Plus, BookOpen, Settings, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton } from "@/components/user-button";

const navItems = [
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/projects/new", label: "New", icon: Plus },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Catalog", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white md:hidden">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive =
              item.href === "/projects"
                ? pathname === "/projects" || (pathname.startsWith("/projects/") && pathname !== "/projects/new")
                : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors min-w-[64px]",
                  isActive ? "text-brand-blue" : "text-gray-500"
                )}
              >
                <item.icon className={cn("h-6 w-6", item.href === "/projects/new" && "h-7 w-7")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-gray-200 bg-brand-navy md:block">
        <div className="flex h-16 items-center gap-3 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white font-bold text-sm">
            ER
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white">Excel CES</div>
            <div className="text-xs text-blue-200">v1.0</div>
          </div>
          <UserButton />
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive =
              item.href === "/projects"
                ? pathname === "/projects" || (pathname.startsWith("/projects/") && pathname !== "/projects/new")
                : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-blue-200 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label === "New" ? "New Project" : item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
