import {
  createAdminSession,
  getAdminConfiguration,
  verifyAdminPassword,
} from "../config/adminAuth.js";

export async function loginAdmin(req, res) {
  const config = getAdminConfiguration();
  if (!config) {
    return res.status(503).json({
      success: false,
      message: "Admin login is not configured on this server.",
    });
  }

  const passwordMatches = await verifyAdminPassword(
    req.body.password,
    config.passwordHash
  );
  const emailMatches = req.body.email === config.email;

  if (!passwordMatches || !emailMatches) {
    return res.status(401).json({
      success: false,
      message: "The email or password is incorrect.",
    });
  }

  res.setHeader("Cache-Control", "no-store");
  return res.json({
    success: true,
    data: {
      email: config.email,
      token: createAdminSession(config.email, config.jwtSecret),
    },
  });
}

export function logoutAdmin(req, res) {
  return res.json({ success: true });
}

export function getAdminSession(req, res) {
  return res.json({ success: true, data: { email: req.admin.email } });
}
