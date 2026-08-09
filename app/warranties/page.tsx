"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Clock, AlertTriangle, CheckCircle, ExternalLink, Calendar, RefreshCw } from "lucide-react";

export default function WarrantiesPage() {
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchWarranties = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/warranties");
      if (res.ok) {
        const data = await res.json();
        setWarranties(data.warranties || []);
      }
    } catch (e) {
      console.warn("Warranties fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarranties();
  }, []);

  const filtered = warranties.filter((w) => {
    if (filterStatus === "all") return true;
    return w.calculatedStatus === filterStatus;
  });

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-[#1a1c1a]">
            Warranty &amp; Return Engine
          </h1>
          <p className="text-xs text-[#5f5e5e]">
            Dynamic calculation of remaining coverage, elapsed percentage, and return deadlines
          </p>
        </div>

        <button
          onClick={fetchWarranties}
          className="self-start md:self-auto flex items-center gap-1.5 px-3.5 py-2 bg-[#efeeeb] hover:bg-[#e2dfde] text-[#1a1c1a] font-semibold text-xs rounded-xl transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e5e5e1] pb-3">
        {["all", "active", "expiring", "expired"].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors ${
              filterStatus === st
                ? "bg-[#3525cd] text-white shadow-xs"
                : "bg-[#faf9f6] text-[#464555] hover:bg-[#efeeeb]"
            }`}
          >
            {st} ({st === "all" ? warranties.length : warranties.filter((w) => w.calculatedStatus === st).length})
          </button>
        ))}
      </div>

      {/* Warranties Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 4].map((n) => (
            <div key={n} className="h-44 bg-white rounded-2xl animate-pulse border border-[#e5e5e1]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3">
          <Shield className="w-12 h-12 text-[#c7c4d8] mx-auto" />
          <h3 className="font-display font-bold text-lg text-[#1a1c1a]">
            No {filterStatus !== "all" ? filterStatus : ""} warranties found
          </h3>
          <p className="text-xs text-[#5f5e5e]">
            Scan a receipt with warranty terms to start automatic tracking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((w) => {
            const purchase = w.purchase;
            const item = purchase.items?.[0];
            const returnStats = w.returnStats;

            return (
              <div
                key={w.id}
                className="glass-card glass-card-hover rounded-2xl p-6 space-y-4 relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#3525cd] bg-[#e2dfff]/60 px-2 py-0.5 rounded-md">
                      {purchase.category}
                    </span>
                    <h3 className="font-display font-bold text-base text-[#1a1c1a] mt-1">
                      {item?.productName || purchase.storeName}
                    </h3>
                    <p className="text-xs text-[#5f5e5e]">{purchase.storeName}</p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full ${
                      w.calculatedStatus === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : w.calculatedStatus === "expiring"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {w.calculatedStatus === "active" && <CheckCircle className="w-3.5 h-3.5" />}
                    {w.calculatedStatus === "expiring" && <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />}
                    {w.calculatedStatus === "expired" && <Shield className="w-3.5 h-3.5" />}
                    <span className="capitalize">{w.calculatedStatus}</span>
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#5f5e5e]">
                      Duration: {w.durationMonths} Months ({w.totalDays} Days)
                    </span>
                    <span className="text-[#3525cd] font-bold">
                      {w.daysRemaining} Days Remaining
                    </span>
                  </div>

                  <div className="w-full bg-[#efeeeb] rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        w.calculatedStatus === "active"
                          ? "bg-[#3525cd]"
                          : w.calculatedStatus === "expiring"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${w.percentageElapsed}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#777587]">
                    <span>Start: {new Date(w.startDate).toLocaleDateString()}</span>
                    <span>Expires: {w.expiryDateFormatted}</span>
                  </div>
                </div>

                {/* Return Window Banner */}
                {returnStats && (
                  <div className="p-3 bg-[#faf9f6] border border-[#e5e5e1] rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[#5f5e5e]">
                      <Clock className="w-4 h-4 text-[#3525cd]" />
                      <span>Return Window:</span>
                    </div>
                    <span className="font-bold text-[#1a1c1a]">
                      {returnStats.isEligible
                        ? `${returnStats.daysRemaining} days left for return`
                        : "Return Window Closed"}
                    </span>
                  </div>
                )}

                {/* Footer Action Link */}
                <div className="pt-2 border-t border-[#efeeeb] flex items-center justify-end">
                  <Link
                    href={`/vault?id=${purchase.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-[#3525cd] hover:underline"
                  >
                    View Receipt Details <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
