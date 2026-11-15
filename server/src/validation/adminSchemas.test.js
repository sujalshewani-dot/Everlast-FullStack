import assert from "node:assert/strict";
import test from "node:test";
import {
  productInputSchema,
  productUpdateSchema,
} from "./adminSchemas.js";

test("product input requires valid stock, size price base, and safe image path", () => {
  const product = {
    name: "Test Fragrance",
    category: "men",
    image: "/images/products/test.png",
    price: 2400,
    stock55: 2,
    stock110: 1,
  };

  assert.equal(productInputSchema.parse(product).price, 2400);
  assert.equal(
    productInputSchema.safeParse({ ...product, image: "javascript:alert(1)" }).success,
    false
  );
  assert.equal(
    productInputSchema.safeParse({ ...product, stock55: -1 }).success,
    false
  );
});

test("partial product updates do not reset omitted stock or visibility", () => {
  const parsed = productUpdateSchema.parse({ price: 2800 });

  assert.deepEqual(parsed, { price: 2800 });
  assert.equal(productUpdateSchema.safeParse({}).success, false);
});
