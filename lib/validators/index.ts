import { z } from "zod";

export const SignUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const PurchaseItemSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  brand: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
});

export const PurchaseCreateSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  totalAmount: z.number().min(0, "Total amount must be positive"),
  currency: z.string().default("INR"),
  category: z.string().default("General"),
  invoiceNumber: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  receiptId: z.string().nullable().optional(),
  items: z.array(PurchaseItemSchema).min(1, "At least one product item is required"),
  warranty: z.object({
    durationMonths: z.number().nullable().optional(),
    startDate: z.string().nullable().optional(),
  }).nullable().optional(),
  returnWindow: z.object({
    durationDays: z.number().nullable().optional(),
    startDate: z.string().nullable().optional(),
  }).nullable().optional(),
});

export const PurchaseUpdateSchema = PurchaseCreateSchema.partial();

export const AiQuerySchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
});

export const SettingsUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  notificationPreferences: z.string().optional(),
  reminderPreferences: z.string().optional(),
});
