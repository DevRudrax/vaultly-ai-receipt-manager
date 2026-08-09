import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Vaultly database...");

  // Ensure public/uploads folder exists
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Create SVG dummy receipt generator helper
  const createMockReceiptSvg = (store: string, total: string, item: string, date: string, filename: string) => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
      <rect width="400" height="600" fill="#faf9f6"/>
      <rect x="20" y="20" width="360" height="560" rx="12" fill="#ffffff" stroke="#c7c4d8" stroke-width="2"/>
      <text x="200" y="70" font-family="Hanken Grotesk, sans-serif" font-weight="bold" font-size="24" text-anchor="middle" fill="#3525cd">${store}</text>
      <text x="200" y="100" font-family="Inter, sans-serif" font-size="14" text-anchor="middle" fill="#5f5e5e">OFFICIAL RECEIPT &amp; TAX INVOICE</text>
      <line x1="40" y1="120" x2="360" y2="120" stroke="#efeeeb" stroke-width="2" stroke-dasharray="6,6"/>
      
      <text x="40" y="150" font-family="Inter, sans-serif" font-size="12" fill="#777587">DATE: ${date}</text>
      <text x="40" y="170" font-family="Inter, sans-serif" font-size="12" fill="#777587">INVOICE: INV-${Math.floor(10000 + Math.random() * 90000)}</text>
      
      <line x1="40" y1="190" x2="360" y2="190" stroke="#c7c4d8" stroke-width="1"/>
      
      <text x="40" y="220" font-family="Hanken Grotesk, sans-serif" font-weight="600" font-size="15" fill="#1a1c1a">${item}</text>
      <text x="40" y="245" font-family="Inter, sans-serif" font-size="13" fill="#5f5e5e">Qty: 1 @ ${total}</text>
      <text x="360" y="245" font-family="Hanken Grotesk, sans-serif" font-weight="bold" font-size="15" text-anchor="end" fill="#1a1c1a">${total}</text>
      
      <line x1="40" y1="300" x2="360" y2="300" stroke="#c7c4d8" stroke-width="1"/>
      
      <text x="40" y="340" font-family="Hanken Grotesk, sans-serif" font-weight="bold" font-size="18" fill="#1a1c1a">TOTAL AMOUNT</text>
      <text x="360" y="340" font-family="Hanken Grotesk, sans-serif" font-weight="bold" font-size="22" text-anchor="end" fill="#3525cd">${total}</text>
      
      <rect x="40" y="380" width="320" height="60" rx="8" fill="#e2dfff"/>
      <text x="200" y="415" font-family="Hanken Grotesk, sans-serif" font-weight="600" font-size="14" text-anchor="middle" fill="#0f0069">✓ VERIFIED VAULTLY DIGITAL RECEIPT</text>
      
      <circle cx="200" cy="500" r="30" fill="#4f46e5" opacity="0.1"/>
      <text x="200" y="505" font-family="Hanken Grotesk, sans-serif" font-size="11" text-anchor="middle" fill="#4f46e5">VAULTLY PROTECTED</text>
    </svg>`;
    fs.writeFileSync(path.join(uploadsDir, filename), svgContent);
    return `/uploads/${filename}`;
  };

  // Demo User
  const passwordHash = await bcrypt.hash("password123", 10);
  const demoEmail = "demo@vaultly.app";

  await prisma.user.deleteMany({ where: { email: demoEmail } });

  const user = await prisma.user.create({
    data: {
      name: "Alex Vance",
      email: demoEmail,
      passwordHash,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      settings: {
        create: {
          currency: "INR",
          timezone: "Asia/Kolkata",
          notificationPreferences: JSON.stringify({ email: true, app: true }),
        },
      },
    },
  });

  const now = new Date();

  // Purchases list
  const seedPurchases = [
    {
      storeName: "Croma",
      productName: "Samsung 55 OLED 4K Smart TV",
      brand: "Samsung",
      category: "Electronics",
      price: 74999,
      monthsAgo: 2,
      warrantyMonths: 24,
      returnDays: 14,
      receiptFile: "receipt_samsung_tv.svg",
      notes: "Serial No: SN-9948271. Purchased for living room wall mount.",
    },
    {
      storeName: "Apple Store",
      productName: "Apple AirPods Pro (2nd Gen)",
      brand: "Apple",
      category: "Audio",
      price: 24900,
      monthsAgo: 11, // Expiring warranty soon! (1 month remaining)
      warrantyMonths: 12,
      returnDays: 14,
      receiptFile: "receipt_airpods.svg",
      notes: "Includes MagSafe Charging Case (USB-C). AppleCare active.",
    },
    {
      storeName: "Amazon",
      productName: "Sony WH-1000XM5 Noise Canceling Headphones",
      brand: "Sony",
      category: "Audio",
      price: 29990,
      monthsAgo: 1,
      warrantyMonths: 12,
      returnDays: 14,
      receiptFile: "receipt_sony.svg",
      notes: "Black color edition. Includes carrying case and aux cable.",
    },
    {
      storeName: "Reliance Digital",
      productName: "LG 423L Double Door Refrigerator",
      brand: "LG",
      category: "Appliances",
      price: 58999,
      monthsAgo: 4,
      warrantyMonths: 24,
      returnDays: 14,
      receiptFile: "receipt_lg.svg",
      notes: "Smart Inverter Compressor with 10 year compressor warranty.",
    },
    {
      storeName: "Dyson Flagship",
      productName: "Dyson Purifier Cool Gen1",
      brand: "Dyson",
      category: "Home Appliances",
      price: 42500,
      monthsAgo: 0.2, // Very recent purchase inside return window!
      warrantyMonths: 24,
      returnDays: 14,
      receiptFile: "receipt_dyson.svg",
      notes: "HEPA H13 filtration system. White/Silver color.",
    },
    {
      storeName: "Nike Flagship",
      productName: "Nike Air Max 270",
      brand: "Nike",
      category: "Apparel",
      price: 12999,
      monthsAgo: 0.1, // Return window active!
      warrantyMonths: 6,
      returnDays: 30,
      receiptFile: "receipt_nike.svg",
      notes: "Size 10 UK / Triple Black edition.",
    },
  ];

  for (const item of seedPurchases) {
    const pDate = new Date(now);
    pDate.setDate(pDate.getDate() - Math.round(item.monthsAgo * 30));

    const receiptUrl = createMockReceiptSvg(
      item.storeName,
      `₹${item.price.toLocaleString()}`,
      item.productName,
      pDate.toISOString().split("T")[0],
      item.receiptFile
    );

    const purchase = await prisma.purchase.create({
      data: {
        userId: user.id,
        storeName: item.storeName,
        purchaseDate: pDate,
        totalAmount: item.price,
        currency: "INR",
        category: item.category,
        invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
        notes: item.notes,
        items: {
          create: [
            {
              productName: item.productName,
              brand: item.brand,
              category: item.category,
              quantity: 1,
              unitPrice: item.price,
              totalPrice: item.price,
            },
          ],
        },
      },
    });

    // Receipt
    await prisma.receipt.create({
      data: {
        userId: user.id,
        purchaseId: purchase.id,
        fileUrl: receiptUrl,
        fileType: "image/svg+xml",
        originalFileName: item.receiptFile,
        fileSize: 2048,
        extractedText: `${item.storeName} OFFICIAL RECEIPT\nDate: ${pDate.toISOString().split("T")[0]}\nItem: ${item.productName}\nPrice: ₹${item.price}`,
        processingStatus: "completed",
      },
    });

    // Warranty
    const wExpiry = new Date(pDate);
    wExpiry.setMonth(wExpiry.getMonth() + item.warrantyMonths);
    const daysRem = Math.ceil((wExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let wStatus = "active";
    if (daysRem <= 0) wStatus = "expired";
    else if (daysRem <= 30) wStatus = "expiring";

    await prisma.warranty.create({
      data: {
        purchaseId: purchase.id,
        durationMonths: item.warrantyMonths,
        startDate: pDate,
        expiryDate: wExpiry,
        status: wStatus,
      },
    });

    // Return window
    const rExpiry = new Date(pDate);
    rExpiry.setDate(rExpiry.getDate() + item.returnDays);
    const rDaysRem = Math.ceil((rExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    let rStatus = rDaysRem > 0 ? (rDaysRem <= 3 ? "expiring" : "active") : "expired";

    await prisma.returnWindow.create({
      data: {
        purchaseId: purchase.id,
        startDate: pDate,
        expiryDate: rExpiry,
        status: rStatus,
      },
    });
  }

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: "warranty_expiring",
        title: "Warranty Expiring Soon",
        message: "Your Apple AirPods Pro warranty will expire in less than 30 days.",
        read: false,
      },
      {
        userId: user.id,
        type: "return_expiring",
        title: "Return Window Closing",
        message: "Dyson Purifier Cool return window has 12 days remaining.",
        read: false,
      },
      {
        userId: user.id,
        type: "system",
        title: "Welcome to Vaultly",
        message: "Your digital vault is ready. All receipts and warranties are now encrypted and backed up.",
        read: true,
      },
    ],
  });

  console.log("Database seeded successfully with demo account:", demoEmail);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
