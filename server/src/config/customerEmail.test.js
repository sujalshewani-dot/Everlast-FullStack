import assert from "node:assert/strict";
import test from "node:test";
import { createCustomerEmailTransport } from "./customerEmail.js";

test("customer email delivery requires complete SMTP settings", () => {
  assert.equal(createCustomerEmailTransport({}), null);

  const email = createCustomerEmailTransport({
    SMTP_HOST: "smtp.example.test",
    SMTP_PORT: "587",
    SMTP_USER: "smtp-user",
    SMTP_PASS: "test-only-password",
    SMTP_FROM: "Everlast <orders@example.test>",
  });

  assert.equal(email.from, "Everlast <orders@example.test>");
  assert.ok(email.transport);
});
