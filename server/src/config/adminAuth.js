import {
  createHmac,
  randomBytes,
  scrypt as callbackScrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(callbackScrypt);
const SESSION_TTL_SECONDS = 8 * 60 * 60;

export function getAdminConfiguration() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const jwtSecret = process.env.JWT_SECRET;

  if (!email || !passwordHash || !jwtSecret || jwtSecret.length < 32) {
    return null;
  }

  return { email, passwordHash, jwtSecret };
}

export async function hashAdminPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyAdminPassword(password, encodedHash) {
  const [algorithm, salt, expectedHex] = String(encodedHash).split("$");
  if (algorithm !== "scrypt" || !salt || !/^[a-f\d]{128}$/i.test(expectedHex || "")) {
    return false;
  }

  const expected = Buffer.from(expectedHex, "hex");
  const actual = await scrypt(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

function sign(payload, secret) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSession(email, secret, role) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: email,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
      role,
    })
  ).toString("base64url");

  return `${payload}.${sign(payload, secret)}`;
}

function readSession(token, secret) {
  if (!token || typeof token !== "string") return null;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      typeof claims.sub !== "string" ||
      typeof claims.exp !== "number" ||
      claims.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return claims;
  } catch {
    return null;
  }
}

export function createAdminSession(email, secret) {
  return createSession(email, secret, "admin");
}

export function readAdminSession(token, secret) {
  const claims = readSession(token, secret);
  return claims && (claims.role === "admin" || claims.role === undefined)
    ? claims
    : null;
}

export function createCustomerSession(email, secret) {
  return createSession(email, secret, "customer");
}

export function readCustomerSession(token, secret) {
  const claims = readSession(token, secret);
  return claims?.role === "customer" ? claims : null;
}

