"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

/** Mobile-only bottom tab bar (thumb-reachable, 44px+ targets). */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t bg-card md:hidden">
      <div className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.shortLabel}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
