"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, PieChart, Store, ShieldCheck, TrendingUp, Award } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((resData) => setData(resData))
      .catch((err) => console.warn("Analytics load error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
        <div className="h-8 w-48 bg-white rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-white rounded-2xl animate-pulse border border-[#e5e5e1]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-[#1a1c1a]">Spending &amp; Warranty Analytics</h1>
        <p className="text-xs text-[#5f5e5e]">Real-time database insights and spending distribution</p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-[#777587]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Spend</span>
            <DollarSign className="w-4 h-4 text-[#3525cd]" />
          </div>
          <p className="font-display font-bold text-2xl text-[#3525cd]">
            ₹{data.totalSpend.toLocaleString()}
          </p>
          <span className="text-[11px] text-[#5f5e5e]">{data.totalPurchases} purchases tracked</span>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-[#777587]">
            <span className="text-xs font-semibold uppercase tracking-wider">Warranty Coverage</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-display font-bold text-2xl text-[#1a1c1a]">
            {data.warrantyCoveragePercentage}%
          </p>
          <span className="text-[11px] text-[#5f5e5e]">
            {data.itemsWithWarrantyCount} of {data.totalPurchases} covered
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-[#777587]">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Store</span>
            <Store className="w-4 h-4 text-[#3525cd]" />
          </div>
          <p className="font-display font-bold text-xl text-[#1a1c1a] truncate">
            {data.topStores?.[0]?.name || "N/A"}
          </p>
          <span className="text-[11px] text-[#5f5e5e]">
            ₹{(data.topStores?.[0]?.amount || 0).toLocaleString()} spent
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-[#777587]">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Purchase</span>
            <TrendingUp className="w-4 h-4 text-[#3525cd]" />
          </div>
          <p className="font-display font-bold text-2xl text-[#1a1c1a]">
            ₹
            {data.totalPurchases > 0
              ? Math.round(data.totalSpend / data.totalPurchases).toLocaleString()
              : 0}
          </p>
          <span className="text-[11px] text-[#5f5e5e]">Per receipt average</span>
        </div>
      </div>

      {/* Main Charts & Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Category Breakdown */}
        <div className="md:col-span-7 glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-[#1a1c1a] flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[#3525cd]" /> Spending by Category
            </h3>
          </div>

          <div className="space-y-4 pt-2">
            {data.categoryBreakdown?.map((cat: any) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#1a1c1a]">{cat.name}</span>
                  <div className="space-x-2">
                    <span className="text-[#5f5e5e]">{cat.percentage}%</span>
                    <span className="text-[#3525cd] font-bold">₹{cat.amount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="w-full bg-[#efeeeb] rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#3525cd] h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Stores */}
        <div className="md:col-span-5 glass-card rounded-2xl p-6 space-y-4">
          <h3 className="font-display font-bold text-base text-[#1a1c1a] flex items-center gap-2">
            <Award className="w-5 h-5 text-[#3525cd]" /> Top Retailers
          </h3>

          <div className="space-y-3 pt-2">
            {data.topStores?.map((st: any, i: number) => (
              <div
                key={st.name}
                className="p-3 bg-[#faf9f6] rounded-xl border border-[#e5e5e1] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#e2dfff] text-[#3525cd] font-bold flex items-center justify-center text-[11px]">
                    {i + 1}
                  </span>
                  <span className="font-bold text-[#1a1c1a]">{st.name}</span>
                </div>
                <span className="font-semibold text-[#3525cd]">₹{st.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Most Expensive Purchases List */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="font-display font-bold text-base text-[#1a1c1a]">Most Expensive Purchases</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.mostExpensivePurchases?.map((p: any) => (
            <div key={p.id} className="p-4 bg-[#faf9f6] rounded-xl border border-[#e5e5e1] space-y-1">
              <span className="text-[10px] text-[#777587] uppercase font-bold">{p.storeName}</span>
              <h4 className="font-display font-bold text-sm text-[#1a1c1a]">{p.productName}</h4>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[#777587]">{p.purchaseDate}</span>
                <span className="font-bold text-[#3525cd]">₹{p.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
