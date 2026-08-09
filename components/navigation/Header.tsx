"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Sparkles, Bell, Menu, X, Shield, Search } from "lucide-react";

interface HeaderProps {
  onToggleAiDrawer: () => void;
  onOpenSearch?: () => void;
}

export function Header({ onToggleAiDrawer, onOpenSearch }: HeaderProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.warn("Notifications fetch error:", e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/all/read", { method: "PATCH" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.warn("Mark read failed:", e);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#faf9f6]/90 backdrop-blur-md border-b border-[#e5e5e1] px-4 md:px-8 py-3 flex items-center justify-between">
      {/* Mobile Menu & Logo */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#3525cd] text-white flex items-center justify-center font-bold font-display shadow-md">
            V
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-[#1a1c1a]">
            Vaultly
          </span>
        </Link>
      </div>

      {/* Global Actions: Search, AI Assistant, Notifications, User Avatar */}
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={onToggleAiDrawer}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#4f46e5]/10 text-[#3525cd] hover:bg-[#4f46e5]/20 font-display font-semibold text-xs md:text-sm transition-all duration-200"
        >
          <Sparkles className="w-4 h-4 text-[#3525cd] animate-pulse" />
          <span>Vaultly AI</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full text-[#464555] hover:bg-[#efeeeb] transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#ba1a1a] ring-2 ring-[#faf9f6]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-lifted border border-[#e5e5e1] p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-[#efeeeb]">
                <h4 className="font-display font-bold text-[#1a1c1a] text-sm">Notifications</h4>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-[#3525cd] font-semibold hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto py-2 flex flex-col gap-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-[#464555] py-4 text-center">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl text-xs transition-all ${
                        n.read ? "bg-[#faf9f6]" : "bg-[#e2dfff]/40 border-l-2 border-[#3525cd]"
                      }`}
                    >
                      <p className="font-semibold text-[#1a1c1a]">{n.title}</p>
                      <p className="text-[#464555] mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-[#777587] mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <Link
          href="/settings"
          className="w-9 h-9 rounded-full overflow-hidden border border-[#c7c4d8] flex items-center justify-center bg-[#efeeeb] hover:opacity-90 transition-opacity"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-bold text-xs text-[#3525cd]">{user?.name?.[0] || "U"}</span>
          )}
        </Link>
      </div>
    </header>
  );
}
