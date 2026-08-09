"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  AlertTriangle,
  ShoppingBag,
  DollarSign,
  Scan,
  Sparkles,
  ArrowRight,
  Clock,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((resData) => setData(resData))
      .catch((err) => console.warn("Dashboard error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
        <div className="h-10 w-48 bg-white rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 bg-white rounded-2xl animate-pulse border border-[#e5e5e1]" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = data.metrics || {};

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* AI Contextual Insight Banner */}
      <div className="bg-[#e2dfff]/50 border border-[#c7c4d8] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#3525cd] text-white flex items-center justify-center shrink-0 shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#3525cd]">
              Vaultly AI Insight
            </span>
            <p className="text-sm font-medium text-[#1a1c1a] mt-0.5">{data.aiInsight}</p>
          </div>
        </div>

        <button
          onClick={() => router.push("/scan")}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#3525cd] hover:bg-[#4f46e5] text-white font-semibold text-xs rounded-xl shadow-md transition-all shrink-0"
        >
          <Scan className="w-4 h-4" /> Scan New Receipt
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-[#777587]">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Warranties</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-display font-bold text-3xl text-[#1a1c1a]">
            {metrics.activeWarranties || 0}
          </p>
          <span className="text-[11px] text-[#5f5e5e]">Safely protected</span>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-[#777587]">
            <span className="text-xs font-semibold uppercase tracking-wider">Expiring Soon</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="font-display font-bold text-3xl text-amber-600">
            {metrics.expiringWarranties || 0}
          </p>
          <span className="text-[11px] text-[#5f5e5e]">Needs attention in 30d</span>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-[#777587]">
            <span className="text-xs font-semibold uppercase tracking-wider">Spend This Month</span>
            <DollarSign className="w-4 h-4 text-[#3525cd]" />
          </div>
          <p className="font-display font-bold text-2xl text-[#3525cd]">
            ₹{(metrics.monthlySpending || 0).toLocaleString()}
          </p>
          <span className="text-[11px] text-[#5f5e5e]">
            {metrics.purchasesThisMonth || 0} receipts this month
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-[#777587]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Purchases</span>
            <ShoppingBag className="w-4 h-4 text-[#3525cd]" />
          </div>
          <p className="font-display font-bold text-3xl text-[#1a1c1a]">
            {metrics.totalPurchases || 0}
          </p>
          <span className="text-[11px] text-[#5f5e5e]">In your vault</span>
        </div>
      </div>

      {/* Grid Content: Upcoming Deadlines & Recent Purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Deadlines (5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-[#1a1c1a] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#3525cd]" /> Upcoming Deadlines
            </h3>
            <Link
              href="/warranties"
              className="text-xs text-[#3525cd] font-semibold hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {data.upcomingDeadlines?.length === 0 ? (
              <p className="text-xs text-[#5f5e5e] py-6 text-center">No upcoming deadlines.</p>
            ) : (
              data.upcomingDeadlines?.map((item: any) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-[#faf9f6] rounded-xl border border-[#e5e5e1] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#777587]">
                      {item.type === "warranty" ? "Warranty Expiring" : "Return Window Closing"}
                    </span>
                    <p className="font-bold text-[#1a1c1a]">{item.title}</p>
                    <p className="text-[11px] text-[#5f5e5e]">{item.storeName}</p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block font-bold px-2 py-0.5 rounded-full text-[11px] ${
                        item.daysRemaining <= 7
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.daysRemaining} days left
                    </span>
                    <span className="text-[10px] text-[#777587] block mt-1">{item.expiryDate}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Purchases (7 cols) */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-[#1a1c1a] flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#3525cd]" /> Recent Purchases
            </h3>
            <Link
              href="/vault"
              className="text-xs text-[#3525cd] font-semibold hover:underline flex items-center gap-1"
            >
              Open Vault <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {data.recentPurchases?.map((p: any) => (
              <Link
                key={p.id}
                href={`/vault?id=${p.id}`}
                className="p-3.5 bg-[#faf9f6] hover:bg-[#e2dfff]/30 rounded-xl border border-[#e5e5e1] flex items-center justify-between transition-colors block text-xs"
              >
                <div>
                  <p className="font-bold text-[#1a1c1a]">
                    {p.items?.[0]?.productName || p.storeName}
                  </p>
                  <p className="text-[11px] text-[#5f5e5e]">
                    {p.storeName} • {new Date(p.purchaseDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#3525cd] text-sm block">
                    ₹{p.totalAmount.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-semibold text-[#777587] uppercase">
                    {p.category}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
