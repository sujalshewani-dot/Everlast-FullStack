import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import CustomerLoginCode from "../models/CustomerLoginCode.js";
import Order from "../models/Order.js";
import { createCustomerSession } from "../config/adminAuth.js";
import { createCustomerEmailTransport } from "../config/customerEmail.js";

const CODE_TTL_MS = 10 * 60 * 1000;
const CODE_RESEND_DELAY_MS = 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const CUSTOMER_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const genericCodeResponse =
  "If there are previous orders for this email, a sign-in code has been sent.";

function getCustomerSessionSecret() {
  const secret =
    process.env.CUSTOMER_SESSION_SECRET || process.env.JWT_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export function hashCustomerCode(email, code, secret) {
  return createHmac("sha256", secret)
    .update(`${email}:${code}`)
    .digest("hex");
}

function codeHashesMatch(actualHash, expectedHash) {
  const actual = Buffer.from(actualHash, "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return (
    actual.length === expected.length &&
    timingSafeEqual(actual, expected)
  );
}

export function serializeCustomerOrder(order) {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    total: order.total,
    items: order.items.map((item) => ({
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      selectedSize: item.selectedSize,
    })),
  };
}

export async function requestCustomerCode(req, res) {
  const secret = getCustomerSessionSecret();
  const emailTransport = createCustomerEmailTransport();
  if (!secret || !emailTransport) {
    return res.status(503).json({
      success: false,
      message:
        "Customer email sign-in is not configured. Configure SMTP and the customer session secret.",
    });
  }

  const email = req.body.email;
  const now = new Date();
  const recentCode = await CustomerLoginCode.exists({
    email,
    createdAt: { $gt: new Date(now.getTime() - CODE_RESEND_DELAY_MS) },
  });
  if (recentCode) {
    res.setHeader("Cache-Control", "no-store");
    return res.json({ success: true, message: genericCodeResponse });
  }

  const hasOrders = await Order.exists({ "customer.email": email });
  if (!hasOrders) {
    res.setHeader("Cache-Control", "no-store");
    return res.json({ success: true, message: genericCodeResponse });
  }

  const code = randomInt(0, 1000000).toString().padStart(6, "0");
  const codeHash = hashCustomerCode(email, code, secret);
  await CustomerLoginCode.findOneAndUpdate(
    { email },
    {
      $set: {
        codeHash,
        attempts: 0,
        expiresAt: new Date(now.getTime() + CODE_TTL_MS),
        createdAt: now,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await emailTransport.transport.sendMail({
      from: emailTransport.from,
      to: email,
      subject: "Your Everlast sign-in code",
      text: `Your Everlast order-history sign-in code is ${code}. It expires in 10 minutes. Do not share this code with anyone.`,
      html: `<p>Your Everlast order-history sign-in code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>It expires in 10 minutes. Do not share this code with anyone.</p>`,
    });
  } catch (error) {
    await CustomerLoginCode.deleteOne({ email, codeHash });
    throw error;
  }

  res.setHeader("Cache-Control", "no-store");
  return res.json({ success: true, message: genericCodeResponse });
}

export async function verifyCustomerCode(req, res) {
  const secret = getCustomerSessionSecret();
  if (!secret) {
    return res.status(503).json({
      success: false,
      message: "Customer sign-in is not configured on this server.",
    });
  }

  const { email, code } = req.body;
  const now = new Date();
  const loginCode = await CustomerLoginCode.findOne({
    email,
    expiresAt: { $gt: now },
  });

  if (!loginCode || loginCode.attempts >= MAX_CODE_ATTEMPTS) {
    return res.status(401).json({
      success: false,
      message: "The sign-in code is invalid or has expired.",
    });
  }

  const submittedHash = hashCustomerCode(email, code, secret);
  if (!codeHashesMatch(submittedHash, loginCode.codeHash)) {
    const updated = await CustomerLoginCode.updateOne(
      { _id: loginCode._id, attempts: { $lt: MAX_CODE_ATTEMPTS } },
      { $inc: { attempts: 1 } }
    );
    return res.status(updated.modifiedCount === 1 ? 401 : 429).json({
      success: false,
      message:
        updated.modifiedCount === 1
          ? "The sign-in code is invalid or has expired."
          : "Too many incorrect codes. Request a new sign-in code later.",
    });
  }

  const consumedCode = await CustomerLoginCode.findOneAndDelete({
    _id: loginCode._id,
    codeHash: loginCode.codeHash,
    attempts: { $lt: MAX_CODE_ATTEMPTS },
    expiresAt: { $gt: now },
  });
  if (!consumedCode) {
    return res.status(401).json({
      success: false,
      message: "The sign-in code is invalid or has expired.",
    });
  }

  res.setHeader("Cache-Control", "no-store");
  return res.json({
    success: true,
    data: {
      token: createCustomerSession(email, secret),
      expiresAt: Date.now() + CUSTOMER_SESSION_TTL_MS,
    },
  });
}

export async function listCustomerOrders(req, res) {
  const orders = await Order.find({ "customer.email": req.customer.email })
    .sort({ createdAt: -1 })
    .select("orderNumber status createdAt total items")
    .lean();

  res.setHeader("Cache-Control", "no-store");
  return res.json({
    success: true,
    data: orders.map(serializeCustomerOrder),
  });
}
