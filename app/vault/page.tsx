"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import {
  Search,
  Filter,
  Plus,
  Receipt as ReceiptIcon,
  Shield,
  Clock,
  ExternalLink,
  Trash2,
  Edit,
  Download,
  X,
  FileText,
  Store,
  Calendar,
  Sparkles,
} from "lucide-react";

function VaultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStore, setSelectedStore] = useState("all");

  // Selected purchase for Detail Modal
  const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Manual Add Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    storeName: "",
    productName: "",
    brand: "",
    category: "Electronics",
    purchaseDate: new Date().toISOString().split("T")[0],
    price: 0,
    invoiceNumber: "",
    notes: "",
    warrantyMonths: 12,
    returnDays: 14,
  });

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/purchases", window.location.origin);
      if (query.trim()) url.searchParams.set("query", query.trim());
      if (selectedCategory !== "all") url.searchParams.set("category", selectedCategory);
      if (selectedStore !== "all") url.searchParams.set("store", selectedStore);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setPurchases(data.purchases || []);

        // Check if specific ID requested in URL search params
        const reqId = searchParams.get("id");
        if (reqId) {
          const match = data.purchases.find((p: any) => p.id === reqId);
          if (match) {
            setSelectedPurchase(match);
            setShowDetailModal(true);
          }
        }
      }
    } catch (e) {
      console.warn("Fetch purchases error:", e);
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, selectedStore, searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPurchases();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchPurchases]);

  const handleDeletePurchase = async () => {
    if (!selectedPurchase) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/purchases/${selectedPurchase.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Purchase and associated receipt deleted.", "info");
        setShowDetailModal(false);
        setShowDeleteConfirm(false);
        setSelectedPurchase(null);
        fetchPurchases();
      } else {
        showToast("Failed to delete purchase.", "error");
      }
    } catch {
      showToast("Error deleting purchase.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.storeName || !manualForm.productName || manualForm.price <= 0) {
      showToast("Please enter Store Name, Product Name, and valid Price.", "error");
      return;
    }

    try {
      const payload = {
        storeName: manualForm.storeName,
        purchaseDate: manualForm.purchaseDate,
        totalAmount: manualForm.price,
        currency: "INR",
        category: manualForm.category,
        invoiceNumber: manualForm.invoiceNumber,
        notes: manualForm.notes,
        items: [
          {
            productName: manualForm.productName,
            brand: manualForm.brand || null,
            category: manualForm.category,
            quantity: 1,
            unitPrice: manualForm.price,
            totalPrice: manualForm.price,
          },
        ],
        warranty: {
          durationMonths: manualForm.warrantyMonths,
          startDate: manualForm.purchaseDate,
        },
        returnWindow: {
          durationDays: manualForm.returnDays,
          startDate: manualForm.purchaseDate,
        },
      };

      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast("Manual purchase added to vault!", "success");
        setShowManualModal(false);
        fetchPurchases();
      } else {
        showToast("Failed to create manual purchase.", "error");
      }
    } catch {
      showToast("Network error creating purchase.", "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-[#1a1c1a]">Digital Vault</h1>
          <p className="text-xs text-[#5f5e5e]">
            All receipts, purchases, warranties, and return windows safely backed up
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/scan")}
            className="flex items-center gap-2 px-4 py-2 bg-[#3525cd] hover:bg-[#4f46e5] text-white font-semibold text-xs rounded-xl shadow-md transition-all"
          >
            <ReceiptIcon className="w-4 h-4" /> Scan Receipt
          </button>
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#efeeeb] hover:bg-[#e2dfde] text-[#1a1c1a] font-semibold text-xs rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" /> Manual Add
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 w-full flex items-center gap-2 bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2 focus-within:border-[#3525cd] transition-colors">
          <Search className="w-4 h-4 text-[#777587]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product, brand, store, category, or invoice #..."
            className="w-full bg-transparent text-xs md:text-sm text-[#1a1c1a] focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-[#777587] hover:text-[#1a1c1a]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2 text-xs font-semibold text-[#1a1c1a] focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Audio">Audio</option>
            <option value="Appliances">Appliances</option>
            <option value="Home Appliances">Home Appliances</option>
            <option value="Apparel">Apparel</option>
          </select>
        </div>
      </div>

      {/* Purchases Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-44 bg-white rounded-2xl animate-pulse border border-[#e5e5e1]" />
          ))}
        </div>
      ) : purchases.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3">
          <ReceiptIcon className="w-12 h-12 text-[#c7c4d8] mx-auto" />
          <h3 className="font-display font-bold text-lg text-[#1a1c1a]">No purchases found</h3>
          <p className="text-xs text-[#5f5e5e] max-w-sm mx-auto">
            No matching items in your vault. Try clearing filters or scan a new receipt.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchases.map((p) => {
            const item = p.items?.[0];
            const wStats = p.warrantyStats;

            return (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedPurchase(p);
                  setShowDetailModal(true);
                }}
                className="glass-card glass-card-hover rounded-2xl p-5 cursor-pointer flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#3525cd] bg-[#e2dfff]/60 px-2 py-0.5 rounded-md">
                        {p.category}
                      </span>
                      <h3 className="font-display font-bold text-base text-[#1a1c1a] mt-2 group-hover:text-[#3525cd] transition-colors">
                        {item?.productName || p.storeName}
                      </h3>
                      <p className="text-xs text-[#5f5e5e]">{p.storeName}</p>
                    </div>
                    <span className="font-display font-bold text-base text-[#1a1c1a]">
                      ₹{p.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#efeeeb] flex items-center justify-between text-xs">
                  <span className="text-[#777587]">
                    {new Date(p.purchaseDate).toLocaleDateString()}
                  </span>

                  {wStats && (
                    <span
                      className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-full ${
                        wStats.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : wStats.status === "expiring"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      {wStats.status === "expired"
                        ? "Expired"
                        : `${wStats.daysRemaining}d warranty`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-[#e5e5e1]">
            <div className="flex items-center justify-between pb-4 border-b border-[#efeeeb]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3525cd] bg-[#e2dfff] px-2 py-0.5 rounded-md">
                  {selectedPurchase.category}
                </span>
                <h2 className="font-display font-bold text-xl text-[#1a1c1a] mt-1">
                  {selectedPurchase.items?.[0]?.productName || selectedPurchase.storeName}
                </h2>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-full hover:bg-[#efeeeb] text-[#777587]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-[#faf9f6] p-3 rounded-xl border border-[#e5e5e1]">
                <span className="text-[#777587] block font-semibold">Store</span>
                <span className="font-bold text-[#1a1c1a] text-sm">
                  {selectedPurchase.storeName}
                </span>
              </div>
              <div className="bg-[#faf9f6] p-3 rounded-xl border border-[#e5e5e1]">
                <span className="text-[#777587] block font-semibold">Price Paid</span>
                <span className="font-bold text-[#3525cd] text-sm">
                  ₹{selectedPurchase.totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="bg-[#faf9f6] p-3 rounded-xl border border-[#e5e5e1]">
                <span className="text-[#777587] block font-semibold">Purchase Date</span>
                <span className="font-bold text-[#1a1c1a]">
                  {new Date(selectedPurchase.purchaseDate).toLocaleDateString()}
                </span>
              </div>
              <div className="bg-[#faf9f6] p-3 rounded-xl border border-[#e5e5e1]">
                <span className="text-[#777587] block font-semibold">Invoice #</span>
                <span className="font-bold text-[#1a1c1a]">
                  {selectedPurchase.invoiceNumber || "N/A"}
                </span>
              </div>
            </div>

            {/* Warranty & Return Info */}
            <div className="space-y-2">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#777587]">
                Protection &amp; Return Details
              </h4>
              <div className="p-3 bg-[#e2dfff]/30 border border-[#c7c4d8] rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#3525cd]" />
                  <span>
                    Warranty:{" "}
                    <strong>
                      {selectedPurchase.warranty?.durationMonths || 12} Months
                    </strong>
                  </span>
                </div>
                {selectedPurchase.warrantyStats && (
                  <span className="font-bold text-[#3525cd]">
                    {selectedPurchase.warrantyStats.daysRemaining} days left
                  </span>
                )}
              </div>
            </div>

            {/* Receipt Preview */}
            {selectedPurchase.receipt?.fileUrl && (
              <div className="space-y-2">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#777587]">
                  Digital Receipt
                </h4>
                <div className="border border-[#e5e5e1] rounded-2xl overflow-hidden bg-[#faf9f6] p-2 text-center">
                  <img
                    src={selectedPurchase.receipt.fileUrl}
                    alt="Receipt preview"
                    className="max-h-56 mx-auto object-contain rounded-lg shadow-xs"
                  />
                  <a
                    href={selectedPurchase.receipt.fileUrl}
                    target="_blank"
                    download
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#3525cd] hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Original Receipt
                  </a>
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-[#efeeeb]">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete Purchase
              </button>

              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 bg-[#3525cd] text-white font-semibold text-xs rounded-xl hover:bg-[#4f46e5] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#1a1c1a]">Delete Purchase?</h3>
            <p className="text-xs text-[#5f5e5e]">
              This action cannot be undone. Associated receipt image and warranty records will be permanently removed.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 bg-[#efeeeb] text-[#1a1c1a] font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePurchase}
                disabled={deleting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ADD MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form
            onSubmit={handleCreateManual}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#e5e5e1]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#efeeeb]">
              <h3 className="font-display font-bold text-lg text-[#1a1c1a]">Manual Purchase Entry</h3>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-[#777587]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#777587]">Store Name *</label>
              <input
                type="text"
                required
                value={manualForm.storeName}
                onChange={(e) => setManualForm({ ...manualForm, storeName: e.target.value })}
                placeholder="e.g. Croma, Sony Store"
                className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2 text-xs font-semibold text-[#1a1c1a] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#777587]">Product Name *</label>
              <input
                type="text"
                required
                value={manualForm.productName}
                onChange={(e) => setManualForm({ ...manualForm, productName: e.target.value })}
                placeholder="e.g. Sony Wireless Headphones"
                className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2 text-xs font-semibold text-[#1a1c1a] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#777587]">Price (INR) *</label>
                <input
                  type="number"
                  required
                  value={manualForm.price}
                  onChange={(e) => setManualForm({ ...manualForm, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2 text-xs font-bold text-[#3525cd] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#777587]">Category</label>
                <select
                  value={manualForm.category}
                  onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
                  className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2 text-xs text-[#1a1c1a] focus:outline-none"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Audio">Audio</option>
                  <option value="Appliances">Appliances</option>
                  <option value="Apparel">Apparel</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#777587]">Warranty (Months)</label>
                <input
                  type="number"
                  value={manualForm.warrantyMonths}
                  onChange={(e) => setManualForm({ ...manualForm, warrantyMonths: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2 text-xs text-[#1a1c1a] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#777587]">Return Window (Days)</label>
                <input
                  type="number"
                  value={manualForm.returnDays}
                  onChange={(e) => setManualForm({ ...manualForm, returnDays: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2 text-xs text-[#1a1c1a] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 bg-[#efeeeb] text-[#1a1c1a] font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#3525cd] hover:bg-[#4f46e5] text-white font-semibold text-xs rounded-xl shadow-md"
              >
                Save Purchase
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function VaultPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
          <div className="h-10 w-48 bg-white rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 bg-white rounded-2xl animate-pulse border border-[#e5e5e1]" />
            ))}
          </div>
        </div>
      }
    >
      <VaultContent />
    </Suspense>
  );
}

