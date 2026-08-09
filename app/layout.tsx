"use client";

import React, { useState } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { Header } from "@/components/navigation/Header";
import { Sidebar } from "@/components/navigation/Sidebar";
import { BottomNav } from "@/components/navigation/BottomNav";
import { VaultlyAiChatDrawer } from "@/components/ai/VaultlyAiChatDrawer";

function MainAppLayout({ children }: { children: React.ReactNode }) {
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col">
      <Header onToggleAiDrawer={() => setIsAiDrawerOpen(!isAiDrawerOpen)} />

      <div className="flex-1 flex">
        <Sidebar onOpenAiDrawer={() => setIsAiDrawerOpen(true)} />
        <main className="flex-1 pb-24 md:pb-12 px-4 md:px-8 py-6">{children}</main>
      </div>

      <BottomNav />

      <VaultlyAiChatDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
      />
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Vaultly - AI Receipt &amp; Warranty Manager</title>
        <meta
          name="description"
          content="Vaultly extracts receipt data with AI, tracks warranties, return windows, and manages purchase history."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <ToastProvider>
          <AuthProvider>
            <MainAppLayout>{children}</MainAppLayout>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
