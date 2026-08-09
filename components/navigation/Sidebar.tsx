"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Scan,
  ShieldCheck,
  BarChart3,
  Settings,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

interface SidebarProps {
  onOpenAiDrawer: () => void;
}

export function Sidebar({ onOpenAiDrawer }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Digital Vault", href: "/vault", icon: Receipt },
    { name: "Scan Receipt", href: "/scan", icon: Scan },
    { name: "Warranties", href: "/warranties", icon: ShieldCheck },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#faf9f6] border-r border-[#e5e5e1] p-6 h-[calc(100vh-61px)] sticky top-[61px]">
      <div className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-display font-medium text-sm transition-all duration-200 ${
                isActive
                  ? "bg-[#3525cd] text-white shadow-md font-semibold"
                  : "text-[#464555] hover:bg-[#efeeeb] hover:text-[#1a1c1a]"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-[#464555]"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* AI Assistant Quick Card */}
      <div className="p-4 rounded-2xl bg-[#e2dfff]/50 border border-[#c7c4d8]/60 my-4 text-center">
        <div className="w-9 h-9 rounded-full bg-[#3525cd] text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
          <Sparkles className="w-4 h-4" />
        </div>
        <h4 className="font-display font-bold text-[#1a1c1a] text-xs">Vaultly AI Concierge</h4>
        <p className="text-[11px] text-[#464555] mt-1">Ask questions about purchases &amp; warranties</p>
        <button
          onClick={onOpenAiDrawer}
          className="mt-3 w-full py-2 bg-[#3525cd] hover:bg-[#4f46e5] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          Ask Assistant
        </button>
      </div>

      <button
        onClick={() => logout()}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors mt-auto"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out</span>
      </button>
    </aside>
  );
}
