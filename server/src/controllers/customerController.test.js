import assert from "node:assert/strict";
import test from "node:test";
import {
  hashCustomerCode,
  serializeCustomerOrder,
} from "./customerController.js";

test("email codes are bound to their email and secret", () => {
  const hash = hashCustomerCode(
    "shopper@example.com",
    "012345",
    "test-only-secret"
  );

  assert.equal(hash.length, 64);
  assert.notEqual(
    hash,
    hashCustomerCode("other@example.com", "012345", "test-only-secret")
  );
  assert.notEqual(
    hash,
    hashCustomerCode("shopper@example.com", "012345", "different-secret")
  );
});

test("customer order history excludes delivery contact details", () => {
  const visibleOrder = serializeCustomerOrder({
    orderNumber: "EV-123",
    status: "Delivered",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    total: 2400,
    customer: {
      email: "shopper@example.com",
      phone: "555-0100",
      address: "Private address",
    },
    items: [
      {
        productId: "men-1",
        cartKey: "men-1-55 ML",
        name: "Sample scent",
        image: "/images/products/sample.png",
        price: 2400,
        quantity: 1,
        selectedSize: "55 ML",
      },
    ],
  });

  assert.deepEqual(Object.keys(visibleOrder).sort(), [
    "createdAt",
    "items",
    "orderNumber",
    "status",
    "total",
  ]);
  assert.equal("customer" in visibleOrder, false);
  assert.equal("address" in visibleOrder.items[0], false);
});
