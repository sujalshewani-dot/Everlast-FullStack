import { z } from "zod";

const imagePath = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine(
    (value) => value.startsWith("/images/") || /^https:\/\//i.test(value),
    "Use a site image path or HTTPS image URL."
  );

export const adminLoginSchema = z.object({
  email: z.string().trim().email().max(254).toLowerCase(),
  password: z.string().min(1).max(200),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.enum(["men", "women", "new", "premium", "home"]),
  image: imagePath,
  price: z.number().int().positive().max(10000000),
  stock55: z.number().int().min(0).max(1000000),
  stock110: z.number().int().min(0).max(1000000),
  reviews: z.number().int().min(0).max(1000000).default(0),
  bottleLabel: z.string().trim().max(160).default(""),
  priceFrom: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(1000000).default(0),
});

export const productUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    category: z.enum(["men", "women", "new", "premium", "home"]),
    image: imagePath,
    price: z.number().int().positive().max(10000000),
    stock55: z.number().int().min(0).max(1000000),
    stock110: z.number().int().min(0).max(1000000),
    reviews: z.number().int().min(0).max(1000000),
    bottleLabel: z.string().trim().max(160),
    priceFrom: z.boolean(),
    isActive: z.boolean(),
    sortOrder: z.number().int().min(0).max(1000000),
  })
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Provide at least one product field to update."
  );

export const orderStatusSchema = z.object({
  status: z.enum([
    "Payment confirmed",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ]),
});

export const contactStatusSchema = z.object({
  status: z.enum(["new", "read", "resolved"]),
});
