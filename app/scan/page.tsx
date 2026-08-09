"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import {
  UploadCloud,
  Camera,
  FileText,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Store,
  Calendar,
  Tag,
  DollarSign,
  Shield,
  Clock,
  Save,
  RotateCcw,
} from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States: 'upload' | 'processing' | 'verify' | 'error'
  const [step, setStep] = useState<"upload" | "processing" | "verify" | "error">("upload");
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingStatusText, setProcessingStatusText] = useState<string>("Uploading receipt...");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Extracted Data for Verification
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("INR");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [warrantyMonths, setWarrantyMonths] = useState<number>(12);
  const [returnDays, setReturnDays] = useState<number>(14);
  const [confidence, setConfidence] = useState<any>({});
  const [saving, setSaving] = useState<boolean>(false);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    setStep("processing");
    setProcessingProgress(15);
    setProcessingStatusText("1. Uploading receipt...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // 1. Upload File API
      const uploadRes = await fetch("/api/receipts/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "File upload failed.");
      }

      setReceiptId(uploadData.receipt.id);

      // Animate progress steps
      setProcessingProgress(35);
      setProcessingStatusText("2. Reading receipt & OCR...");
      await new Promise((r) => setTimeout(r, 600));

      setProcessingProgress(55);
      setProcessingStatusText("3. Extracting text & structure...");
      await new Promise((r) => setTimeout(r, 600));

      setProcessingProgress(75);
      setProcessingStatusText("4. Identifying products & prices...");
      await new Promise((r) => setTimeout(r, 600));

      setProcessingProgress(90);
      setProcessingStatusText("5. Checking warranty & return terms...");

      // 2. Process Receipt API
      const processRes = await fetch(`/api/receipts/${uploadData.receipt.id}/process`, {
        method: "POST",
      });
      const processData = await processRes.json();

      if (!processRes.ok) {
        throw new Error(processData.error || "Receipt extraction failed.");
      }

      const ext = processData.extractedData;
      setStoreName(ext.storeName || "");
      setPurchaseDate(ext.purchaseDate || new Date().toISOString().split("T")[0]);
      setCurrency(ext.currency || "INR");
      setInvoiceNumber(ext.invoiceNumber || "");
      setCategory(ext.category || "General");

      if (ext.items && ext.items.length > 0) {
        setProductName(ext.items[0].productName || "");
        setBrand(ext.items[0].brand || "");
        setPrice(ext.items[0].totalPrice || ext.totalAmount || 0);
      } else {
        setPrice(ext.totalAmount || 0);
      }

      setWarrantyMonths(ext.warranty?.durationMonths ?? 12);
      setReturnDays(ext.returnWindow?.durationDays ?? 14);
      setConfidence(ext.confidence || {});

      setProcessingProgress(100);
      setStep("verify");
    } catch (err: any) {
      console.error("Scan error:", err);
      setErrorMessage(err.message || "We couldn't process this receipt.");
      setStep("error");
    }
  };

  const handleSaveToVault = async () => {
    if (!storeName || !productName || price < 0) {
      showToast("Please fill in Store Name, Product Name, and Price.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        storeName,
        purchaseDate,
        totalAmount: price,
        currency,
        category,
        invoiceNumber,
        receiptId,
        items: [
          {
            productName,
            brand: brand || null,
            category,
            quantity: 1,
            unitPrice: price,
            totalPrice: price,
          },
        ],
        warranty: {
          durationMonths: warrantyMonths,
          startDate: purchaseDate,
        },
        returnWindow: {
          durationDays: returnDays,
          startDate: purchaseDate,
        },
      };

      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save purchase.");
      }

      showToast("Receipt and purchase saved to your vault!", "success");
      router.push("/vault");
    } catch (err: any) {
      showToast(err.message || "Failed to save purchase.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-[#efeeeb] text-[#464555] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-[#1a1c1a]">Scan Receipt</h1>
          <p className="text-xs text-[#5f5e5e]">
            AI-powered receipt scanning &amp; automatic warranty tracking
          </p>
        </div>
      </div>

      {/* STEP 1: UPLOAD CARD */}
      {step === "upload" && (
        <div className="glass-card rounded-2xl p-8 md:p-12 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-[#4f46e5]/10 text-[#3525cd] flex items-center justify-center mx-auto shadow-inner">
            <Camera className="w-10 h-10" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-[#1a1c1a]">
              Upload or Photograph Receipt
            </h2>
            <p className="text-sm text-[#5f5e5e] max-w-md mx-auto mt-1">
              Supports PNG, JPG, JPEG, WEBP, and PDF. Drag and drop or snap a photo.
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
            className="hidden"
          />

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#c7c4d8] hover:border-[#3525cd] rounded-2xl p-8 bg-[#faf9f6] cursor-pointer transition-colors space-y-3"
          >
            <UploadCloud className="w-10 h-10 text-[#3525cd] mx-auto animate-bounce" />
            <p className="text-sm font-semibold text-[#1a1c1a]">
              Click to select file or drag &amp; drop here
            </p>
            <span className="text-xs text-[#777587] block">Maximum file size: 10MB</span>
          </div>
        </div>
      )}

      {/* STEP 2: PROCESSING ANIMATION */}
      {step === "processing" && (
        <div className="glass-card rounded-2xl p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-[#3525cd] text-white flex items-center justify-center mx-auto shadow-lg">
            <Sparkles className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-[#1a1c1a]">Analyzing Receipt</h2>
            <p className="text-sm text-[#5f5e5e] mt-1">{processingStatusText}</p>
          </div>

          <div className="w-full max-w-md mx-auto bg-[#efeeeb] rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#3525cd] h-full transition-all duration-500 rounded-full"
              style={{ width: `${processingProgress}%` }}
            />
          </div>

          <div className="text-xs font-mono text-[#777587] font-semibold">{processingProgress}% Completed</div>
        </div>
      )}

      {/* STEP 3: ERROR STATE */}
      {step === "error" && (
        <div className="glass-card rounded-2xl p-8 text-center space-y-4 border-l-4 border-[#ba1a1a]">
          <div className="w-14 h-14 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="font-display text-lg font-bold text-[#1a1c1a]">
            We couldn't process this receipt.
          </h2>
          <p className="text-sm text-[#5f5e5e]">{errorMessage}</p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setStep("upload")}
              className="px-4 py-2 bg-[#3525cd] text-white font-semibold rounded-xl text-sm hover:bg-[#4f46e5] transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                setStoreName("");
                setProductName("");
                setPrice(0);
                setStep("verify");
              }}
              className="px-4 py-2 bg-[#efeeeb] text-[#1a1c1a] font-semibold rounded-xl text-sm hover:bg-[#e2dfde] transition-colors"
            >
              Enter Manually
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: OCR VERIFICATION SCREEN */}
      {step === "verify" && (
        <div className="space-y-6">
          <div className="bg-[#e2dfff]/40 border border-[#c7c4d8] rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#3525cd] text-white flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-[#1a1c1a] text-sm">
                  Review Extracted Details
                </h3>
                <p className="text-xs text-[#5f5e5e]">
                  Tap any field to edit before saving to your vault.
                </p>
              </div>
            </div>
            <button
              onClick={() => setStep("upload")}
              className="flex items-center gap-1 text-xs font-semibold text-[#3525cd] hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Scan Again
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Store & Date */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#777587] uppercase tracking-wider block mb-1">
                  Store / Merchant Name
                </label>
                <div className="flex items-center gap-2 bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2">
                  <Store className="w-4 h-4 text-[#3525cd]" />
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Croma, Apple Store, Amazon"
                    className="w-full bg-transparent text-sm font-semibold text-[#1a1c1a] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#777587] uppercase tracking-wider block mb-1">
                  Purchase Date
                </label>
                <div className="flex items-center gap-2 bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2">
                  <Calendar className="w-4 h-4 text-[#3525cd]" />
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-[#1a1c1a] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#777587] uppercase tracking-wider block mb-1">
                  Invoice / Order Number
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-99481"
                  className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2 text-sm text-[#1a1c1a] focus:outline-none"
                />
              </div>
            </div>

            {/* Product & Price */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#777587] uppercase tracking-wider block mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Samsung 55 OLED TV"
                  className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2 text-sm font-semibold text-[#1a1c1a] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#777587] uppercase tracking-wider block mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Samsung"
                    className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2 text-sm text-[#1a1c1a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#777587] uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2 text-sm text-[#1a1c1a] focus:outline-none"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Audio">Audio</option>
                    <option value="Appliances">Appliances</option>
                    <option value="Home Appliances">Home Appliances</option>
                    <option value="Apparel">Apparel</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#777587] uppercase tracking-wider block mb-1">
                  Total Amount (INR / ₹)
                </label>
                <div className="flex items-center gap-2 bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2">
                  <DollarSign className="w-4 h-4 text-[#3525cd]" />
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent text-base font-bold text-[#3525cd] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Warranty & Return Window Engine Controls */}
          <div className="glass-card rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#777587] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Shield className="w-4 h-4 text-[#3525cd]" /> Warranty Duration (Months)
              </label>
              <input
                type="number"
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(parseInt(e.target.value, 10) || 0)}
                placeholder="12"
                className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2 text-sm font-semibold text-[#1a1c1a] focus:outline-none"
              />
              <span className="text-[11px] text-[#777587] mt-1 block">
                Calculates warranty expiration date automatically.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#777587] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Clock className="w-4 h-4 text-[#3525cd]" /> Return Window (Days)
              </label>
              <input
                type="number"
                value={returnDays}
                onChange={(e) => setReturnDays(parseInt(e.target.value, 10) || 0)}
                placeholder="14"
                className="w-full bg-[#faf9f6] border border-[#e5e5e1] rounded-xl px-3 py-2 text-sm font-semibold text-[#1a1c1a] focus:outline-none"
              />
              <span className="text-[11px] text-[#777587] mt-1 block">
                Calculates return eligibility remaining days.
              </span>
            </div>
          </div>

          {/* Save Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setStep("upload")}
              className="px-5 py-2.5 rounded-xl bg-[#efeeeb] text-[#1a1c1a] font-semibold text-sm hover:bg-[#e2dfde] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveToVault}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3525cd] hover:bg-[#4f46e5] text-white font-semibold text-sm shadow-md transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save to Vault"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
