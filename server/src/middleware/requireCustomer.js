import { readCustomerSession } from "../config/adminAuth.js";

export function requireCustomer(req, res, next) {
  const secret =
    process.env.CUSTOMER_SESSION_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    return res.status(503).json({
      success: false,
      message: "Customer sign-in is not configured on this server.",
    });
  }

  const authorization = req.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
  const session = readCustomerSession(token, secret);

  if (!session) {
    return res.status(401).json({
      success: false,
      message: "Please sign in to view your orders.",
    });
  }

  req.customer = { email: session.sub };
  return next();
}
