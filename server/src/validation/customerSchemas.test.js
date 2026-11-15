import assert from "node:assert/strict";
import test from "node:test";
import {
  customerCodeSchema,
  customerEmailSchema,
} from "./customerSchemas.js";

test("customer sign-in normalizes email and requires a six-digit code", () => {
  assert.deepEqual(
    customerEmailSchema.parse({ email: "  Shopper@Example.com " }),
    { email: "shopper@example.com" }
  );
  assert.equal(
    customerCodeSchema.safeParse({
      email: "shopper@example.com",
      code: "12345",
    }).success,
    false
  );
  assert.equal(
    customerCodeSchema.safeParse({
      email: "shopper@example.com",
      code: "012345",
    }).success,
    true
  );
});
