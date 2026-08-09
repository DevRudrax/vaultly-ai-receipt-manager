"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import {
  User as UserIcon,
  Key,
  Globe,
  Download,
  Trash2,
  Save,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [password, setPassword] = useState("");
  const [currency, setCurrency] = useState(user?.settings?.currency || "INR");
  const [timezone, setTimezone] = useState(user?.settings?.timezone || "Asia/Kolkata");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { name, settings: { currency, timezone } };
      if (password.trim().length >= 6) {
        payload.password = password;
      }

      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast("Profile and settings updated successfully!", "success");
        setPassword("");
        refreshUser();
      } else {
        showToast("Failed to update settings.", "error");
      }
    } catch {
      showToast("Network error updating settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/export", { method: "POST" });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vaultly_purchases_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("Vault data exported to CSV successfully!", "success");
    } catch {
      showToast("Failed to export vault data.", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/user/delete", { method: "POST" });
      if (res.ok) {
        showToast("Account deleted.", "info");
        logout();
      } else {
        showToast("Failed to delete account.", "error");
      }
    } catch {
      showToast("Network error during account deletion.", "error");
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-[#1a1c1a]">Profile &amp; Settings</h1>
        <p className="text-xs text-[#5f5e5e]">Manage profile, preferences, export data, or delete account</p>
      </div>

      <form onSubmit={handleUpdateProfile} className="glass-card rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-[#efeeeb]">
          <div className="w-14 h-14 rounded-full bg-[#3525cd] text-white font-bold flex items-center justify-center text-xl overflow-hidden shadow-sm">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.[0] || "U"
            )}
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-[#1a1c1a]">{user?.name}</h3>
            <p className="text-xs text-[#777587]">{user?.email}</p>
          </div>
        </div>

        {/* Profile Name & Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#777587] flex items-center gap-1.5 mb-1">
              <UserIcon className="w-4 h-4 text-[#3525cd]" /> Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2 text-sm text-[#1a1c1a] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#777587] flex items-center gap-1.5 mb-1">
              <Key className="w-4 h-4 text-[#3525cd]" /> Change Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2 text-sm text-[#1a1c1a] focus:outline-none"
            />
          </div>
        </div>

        {/* Regional Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#777587] flex items-center gap-1.5 mb-1">
              <Globe className="w-4 h-4 text-[#3525cd]" /> Preferred Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2 text-sm text-[#1a1c1a] focus:outline-none"
            >
              <option value="INR">INR (₹ - Indian Rupee)</option>
              <option value="USD">USD ($ - US Dollar)</option>
              <option value="EUR">EUR (€ - Euro)</option>
              <option value="GBP">GBP (£ - British Pound)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#777587] flex items-center gap-1.5 mb-1">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2 text-sm text-[#1a1c1a] focus:outline-none"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#3525cd] hover:bg-[#4f46e5] text-white font-semibold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Save Profile Changes
          </button>
        </div>
      </form>

      {/* Data Export Card */}
      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-base text-[#1a1c1a] flex items-center gap-2">
            <Download className="w-5 h-5 text-[#3525cd]" /> Export Vault Data
          </h3>
          <p className="text-xs text-[#5f5e5e] mt-1">
            Download your full purchase, store, price, warranty, and return window history in CSV format.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={exporting}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#efeeeb] hover:bg-[#e2dfde] text-[#1a1c1a] font-semibold text-xs rounded-xl transition-colors whitespace-nowrap"
        >
          <Download className="w-4 h-4 text-[#3525cd]" />
          <span>{exporting ? "Generating..." : "Export as CSV"}</span>
        </button>
      </div>

      {/* Delete Account Card */}
      <div className="glass-card rounded-2xl p-6 border-l-4 border-rose-600 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-base text-rose-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Danger Zone: Delete Account
          </h3>
          <p className="text-xs text-[#5f5e5e] mt-1">
            Permanently delete your account, saved receipts, files, and warranty logs.
          </p>
        </div>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-md transition-colors whitespace-nowrap"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#1a1c1a]">Permanently Delete Account?</h3>
            <p className="text-xs text-[#5f5e5e]">
              This will erase all your receipt files, purchases, and warranty records.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 bg-[#efeeeb] text-[#1a1c1a] font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl"
              >
                {deletingAccount ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
