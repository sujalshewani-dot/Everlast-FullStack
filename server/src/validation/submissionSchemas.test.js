import test from "node:test";
import assert from "node:assert/strict";
import {
  contactMessageSchema,
  createOrderSchema,
  newsletterSchema,
} from "./submissionSchemas.js";

const validOrder = {
  customer: {
    email: "customer@example.com",
    fullName: "Everlast Customer",
    phone: "+92 300 1234567",
    city: "Lahore",
    address: "1 Main Street",
  },
  items: [
    {
      productId: "men-1",
      expectedPrice: 2500,
      quantity: 2,
      selectedSize: "55 ML",
    },
  ],
};

test("order schema accepts checkout data and defaults optional fields", () => {
  const parsed = createOrderSchema.parse({
    ...validOrder,
    orderNumber: "client-supplied",
    status: "Delivered",
    total: 1,
  });

  assert.equal(parsed.customer.postalCode, "");
  assert.equal(parsed.billingAddress, "same");
  assert.equal(parsed.billingDetails, null);
  assert.equal(parsed.items[0].selectedSize, "55 ML");
  assert.equal("orderNumber" in parsed, false);
  assert.equal("status" in parsed, false);
  assert.equal("total" in parsed, false);
});

test("order schema rejects empty carts, invalid contact, and excessive quantities", () => {
  assert.equal(createOrderSchema.safeParse({ ...validOrder, items: [] }).success, false);
  assert.equal(
    createOrderSchema.safeParse({
      ...validOrder,
      customer: { ...validOrder.customer, email: "not-an-email-or-phone" },
    }).success,
    false
  );
  assert.equal(
    createOrderSchema.safeParse({
      ...validOrder,
      items: [{ ...validOrder.items[0], quantity: 51 }],
    }).success,
    false
  );
});

test("a different billing address requires billing details", () => {
  assert.equal(
    createOrderSchema.safeParse({
      ...validOrder,
      billingAddress: "different",
    }).success,
    false
  );
});

test("contact and newsletter schemas trim and normalize email input", () => {
  assert.equal(
    contactMessageSchema.parse({ email: "  CUSTOMER@example.com " }).email,
    "customer@example.com"
  );
  assert.equal(
    newsletterSchema.parse({ email: " CUSTOMER@example.com " }).email,
    "customer@example.com"
  );
  assert.equal(
    newsletterSchema.safeParse({ email: "invalid" }).success,
    false
  );
});
