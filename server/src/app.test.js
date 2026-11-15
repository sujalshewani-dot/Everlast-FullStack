import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import app from "./app.js";

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("health reports unavailable until MongoDB is connected", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.status, "database_unavailable");
});

test("invalid orders are rejected before database access", async () => {
  const response = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [] }),
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.ok(Array.isArray(body.errors));
});

test("unknown API routes return a JSON 404", async () => {
  const response = await fetch(`${baseUrl}/api/unknown`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
});

test("customer order history requires a customer session", async () => {
  const previousSecret = process.env.CUSTOMER_SESSION_SECRET;
  process.env.CUSTOMER_SESSION_SECRET = "test-only-customer-session-secret";

  try {
    const response = await fetch(`${baseUrl}/api/customer/orders`);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.message, "Please sign in to view your orders.");
  } finally {
    if (previousSecret === undefined) {
      delete process.env.CUSTOMER_SESSION_SECRET;
    } else {
      process.env.CUSTOMER_SESSION_SECRET = previousSecret;
    }
  }
});

test("customer code requests clearly require configured email delivery", async () => {
  const keys = [
    "CUSTOMER_SESSION_SECRET",
    "JWT_SECRET",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
  ];
  const previous = Object.fromEntries(
    keys.map((key) => [key, process.env[key]])
  );
  keys.forEach((key) => {
    process.env[key] = "";
  });

  try {
    const response = await fetch(`${baseUrl}/api/customer/request-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "shopper@example.com" }),
    });
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.match(body.message, /Configure SMTP/);
  } finally {
    keys.forEach((key) => {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    });
  }
});
