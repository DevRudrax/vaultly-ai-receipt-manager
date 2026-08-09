"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Scan, ShieldCheck, BarChart3 } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Vault", href: "/vault", icon: Receipt },
    { name: "Scan", href: "/scan", icon: Scan, isScan: true },
    { name: "Warranties", href: "/warranties", icon: ShieldCheck },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#e5e5e1] px-4 py-2 flex items-center justify-around">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        if (item.isScan) {
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center -mt-6"
            >
              <div className="w-13 h-13 rounded-full bg-[#3525cd] text-white flex items-center justify-center shadow-lg ring-4 ring-[#faf9f6] hover:scale-105 active:scale-95 transition-transform p-3">
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-semibold text-[#3525cd] mt-1">Scan</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center gap-1 p-1 transition-colors ${
              isActive ? "text-[#3525cd]" : "text-[#777587]"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
