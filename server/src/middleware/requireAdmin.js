import {
  getAdminConfiguration,
  readAdminSession,
} from "../config/adminAuth.js";

export function requireAdmin(req, res, next) {
  res.setHeader("Cache-Control", "no-store");
  const config = getAdminConfiguration();
  if (!config) {
    return res.status(503).json({
      success: false,
      message: "Admin login is not configured on this server.",
    });
  }

  const authorization = req.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const claims = readAdminSession(token, config.jwtSecret);
  if (!claims || claims.sub !== config.email) {
    return res.status(401).json({
      success: false,
      message: "Please sign in as an administrator.",
    });
  }

  req.admin = { email: claims.sub };
  next();
}
