"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Sparkles, ArrowRight, ShieldCheck, Lock } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("demo@vaultly.app");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Incorrect email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo Banner */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#3525cd] text-white font-bold font-display text-2xl flex items-center justify-center mx-auto shadow-md">
            V
          </div>
          <h1 className="font-display font-bold text-3xl text-[#1a1c1a] tracking-tight">
            Vaultly
          </h1>
          <p className="text-xs text-[#5f5e5e] font-medium">Never lose a receipt again.</p>
        </div>

        {/* Login Form Card */}
        <div className="glass-card rounded-3xl p-8 space-y-6 shadow-lifted">
          <div className="space-y-1">
            <h2 className="font-display font-bold text-xl text-[#1a1c1a]">Welcome Back</h2>
            <p className="text-xs text-[#777587]">Log in to access your digital receipt vault</p>
          </div>

          {/* Quick Demo Hint */}
          <div className="p-3.5 bg-[#e2dfff]/50 border border-[#c7c4d8] rounded-xl text-xs flex items-center justify-between">
            <div>
              <span className="font-bold text-[#3525cd] block">Demo Credentials:</span>
              <span className="text-[#1a1c1a]">demo@vaultly.app / password123</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail("demo@vaultly.app");
                setPassword("password123");
              }}
              className="text-[11px] font-bold text-[#3525cd] underline hover:opacity-80"
            >
              Fill Demo
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#777587] uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-4 py-2.5 text-sm text-[#1a1c1a] focus:outline-none focus:border-[#3525cd]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#3525cd] hover:bg-[#4f46e5] text-white font-semibold text-sm rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{submitting ? "Signing In..." : "Log In to Vaultly"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-[#efeeeb]">
            <p className="text-xs text-[#5f5e5e]">
              Don't have an account?{" "}
              <Link href="/signup" className="text-[#3525cd] font-bold hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
