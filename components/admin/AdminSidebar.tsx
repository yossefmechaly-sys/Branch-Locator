"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  MapPin,
  Megaphone,
  MessageSquare,
  Store,
  Upload,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AdminDictionary } from "@/lib/admin-i18n/dictionary";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function AdminSidebar({
  dictionary,
}: {
  dictionary: AdminDictionary;
}) {
  const currentPath = usePathname();

  const navItems: NavItem[] = [
    {
      href: "/admin",
      label: dictionary.navigation.dashboard,
      icon: LayoutDashboard,
    },
    {
      href: "/admin/branches",
      label: dictionary.navigation.branches,
      icon: Store,
    },
    {
      href: "/admin/promotions",
      label: dictionary.navigation.promotions,
      icon: Megaphone,
    },
    {
      href: "/admin/reviews",
      label: dictionary.navigation.reviews,
      icon: MessageSquare,
    },
    {
      href: "/admin/services",
      label: dictionary.navigation.services,
      icon: Wrench,
    },
    {
      href: "/admin/cities",
      label: dictionary.navigation.cities,
      icon: MapPin,
    },
    {
      href: "/admin/analytics",
      label: dictionary.navigation.analytics,
      icon: BarChart3,
    },
    {
      href: "/admin/import-export",
      label: dictionary.navigation.importExport,
      icon: Upload,
    },
  ];

  return (
    <aside className="hidden w-60 shrink-0 border-e bg-background md:flex md:flex-col">
      <div className="flex h-14 items-center border-b px-4 font-semibold tracking-tight">
        Maayan 2000 — Admin
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? currentPath === "/admin"
              : currentPath.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive &&
                  "bg-accent text-accent-foreground font-medium",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
