import { z } from "zod";

const trimmedText = (max) => z.string().trim().min(1).max(max);
const emailSchema = z.string().trim().toLowerCase().email().max(254);
const phoneSchema = z.string().trim().min(10).max(25);
const contactSchema = z
  .string()
  .trim()
  .min(1)
  .max(254)
  .refine(
    (value) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ||
      /^\+?[\d\s()-]{10,25}$/.test(value),
    "Enter a valid email address or mobile phone number."
  );

const orderItemSchema = z.object({
  productId: trimmedText(120),
  expectedPrice: z.number().int().positive().max(10000000),
  quantity: z.number().int().min(1).max(50),
  selectedSize: z.enum(["55 ML", "110 ML"]),
});

const billingDetailsSchema = z.object({
  fullName: trimmedText(160),
  address: trimmedText(500),
  city: trimmedText(120),
});

export const createOrderSchema = z
  .object({
    customer: z.object({
      email: contactSchema,
      fullName: trimmedText(160),
      phone: phoneSchema,
      city: trimmedText(120),
      address: trimmedText(500),
      postalCode: z.string().trim().max(30).optional().default(""),
    }),
    billingAddress: z.enum(["same", "different"]).default("same"),
    billingDetails: billingDetailsSchema.nullable().optional().default(null),
    items: z.array(orderItemSchema).min(1).max(30),
  })
  .refine(
    ({ billingAddress, billingDetails }) =>
      billingAddress !== "different" || billingDetails !== null,
    {
      path: ["billingDetails"],
      message: "Billing details are required for a different billing address.",
    }
  );

export const contactMessageSchema = z.object({
  name: z.string().trim().max(120).optional().default(""),
  email: emailSchema,
  phone: z.string().trim().max(40).optional().default(""),
  comment: z.string().trim().max(5000).optional().default(""),
});

export const newsletterSchema = z.object({
  email: emailSchema,
});
