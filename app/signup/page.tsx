"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { ArrowRight } from "lucide-react";

export default function SignUpPage() {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await signup(name, email, password);
    } catch (err: any) {
      setError(err.message || "Signup failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#3525cd] text-white font-bold font-display text-2xl flex items-center justify-center mx-auto shadow-md">
            V
          </div>
          <h1 className="font-display font-bold text-3xl text-[#1a1c1a] tracking-tight">
            Vaultly
          </h1>
          <p className="text-xs text-[#5f5e5e] font-medium">Create your AI-powered receipt vault</p>
        </div>

        <div className="glass-card rounded-3xl p-8 space-y-6 shadow-lifted">
          <div className="space-y-1">
            <h2 className="font-display font-bold text-xl text-[#1a1c1a]">Create Account</h2>
            <p className="text-xs text-[#777587]">Start tracking receipts, warranties, and returns</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#777587] uppercase tracking-wider block mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Vance"
                className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-4 py-2.5 text-sm text-[#1a1c1a] focus:outline-none focus:border-[#3525cd]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#777587] uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@domain.com"
                className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-4 py-2.5 text-sm text-[#1a1c1a] focus:outline-none focus:border-[#3525cd]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#777587] uppercase tracking-wider block mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-4 py-2.5 text-sm text-[#1a1c1a] focus:outline-none focus:border-[#3525cd]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#3525cd] hover:bg-[#4f46e5] text-white font-semibold text-sm rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{submitting ? "Creating Vault..." : "Create Account"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#efeeeb]">
            <p className="text-xs text-[#5f5e5e]">
              Already have an account?{" "}
              <Link href="/login" className="text-[#3525cd] font-bold hover:underline">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
