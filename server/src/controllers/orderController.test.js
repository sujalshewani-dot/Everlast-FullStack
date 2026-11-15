import assert from "node:assert/strict";
import test from "node:test";
import { getPriceForSize } from "./orderController.js";

test("110 ML price is exactly twice the 55 ML base price", () => {
  const product = { price: 3200 };

  assert.equal(getPriceForSize(product, "55 ML"), 3200);
  assert.equal(getPriceForSize(product, "110 ML"), 6400);
});
