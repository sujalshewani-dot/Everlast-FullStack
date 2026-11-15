import assert from "node:assert/strict";
import test from "node:test";
import {
  createAdminSession,
  createCustomerSession,
  hashAdminPassword,
  readAdminSession,
  readCustomerSession,
  verifyAdminPassword,
} from "./adminAuth.js";

test("admin password hashes verify without storing plaintext", async () => {
  const hash = await hashAdminPassword("a long test-only admin password");

  assert.match(hash, /^scrypt\$/);
  assert.equal(await verifyAdminPassword("a long test-only admin password", hash), true);
  assert.equal(await verifyAdminPassword("wrong password", hash), false);
});

test("admin sessions are signed and reject modified tokens", () => {
  const token = createAdminSession("owner@example.com", "test-only-secret-key");

  assert.equal(
    readAdminSession(token, "test-only-secret-key")?.sub,
    "owner@example.com"
  );
  assert.equal(readAdminSession(`${token}x`, "test-only-secret-key"), null);
  assert.equal(readAdminSession(token, "wrong-test-secret"), null);
});

test("customer sessions are signed with a separate role", () => {
  const token = createCustomerSession(
    "shopper@example.com",
    "test-only-customer-secret"
  );

  assert.equal(
    readCustomerSession(token, "test-only-customer-secret")?.sub,
    "shopper@example.com"
  );
  assert.equal(
    readAdminSession(token, "test-only-customer-secret"),
    null
  );
  assert.equal(
    readCustomerSession(token, "wrong-test-secret"),
    null
  );
});
