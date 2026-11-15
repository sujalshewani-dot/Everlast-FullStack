import test from "node:test";
import assert from "node:assert/strict";
import {
  canTransitionOrderStatus,
  getInventoryAdjustments,
} from "./adminOrderController.js";

test("stock is deducted only when an unpaid order is payment-confirmed", () => {
  const order = {
    inventoryDeducted: false,
    items: [
      { productId: "men-1", selectedSize: "55 ML", quantity: 2 },
      { productId: "women-1", selectedSize: "110 ML", quantity: 1 },
    ],
  };

  assert.deepEqual(getInventoryAdjustments(order, "Payment confirmed"), [
    { routeId: "men-1", stockField: "stock55", quantity: -2 },
    { routeId: "women-1", stockField: "stock110", quantity: -1 },
  ]);
  assert.deepEqual(getInventoryAdjustments(order, "Cancelled"), []);
});

test("cancelling a paid order restores stock exactly once", () => {
  const order = {
    inventoryDeducted: true,
    items: [{ productId: "men-1", selectedSize: "110 ML", quantity: 3 }],
  };

  assert.deepEqual(getInventoryAdjustments(order, "Cancelled"), [
    { routeId: "men-1", stockField: "stock110", quantity: 3 },
  ]);
  assert.deepEqual(getInventoryAdjustments(order, "Processing"), []);
});

test("orders must be payment-confirmed before fulfillment can advance", () => {
  assert.equal(
    canTransitionOrderStatus("Awaiting payment confirmation", "Processing"),
    false
  );
  assert.equal(
    canTransitionOrderStatus("Awaiting payment confirmation", "Payment confirmed"),
    true
  );
  assert.equal(canTransitionOrderStatus("Shipped", "Delivered"), true);
  assert.equal(canTransitionOrderStatus("Delivered", "Cancelled"), false);
});
