import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  getAdminSession,
  loginAdmin,
  logoutAdmin,
} from "../controllers/authController.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { validateBody } from "../middleware/validateBody.js";
import { adminLoginSchema } from "../validation/adminSchemas.js";

const router = Router();

router.post(
  "/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({
        success: false,
        message: "Too many sign-in attempts. Try again later.",
      }),
  }),
  validateBody(adminLoginSchema),
  loginAdmin
);
router.post("/logout", logoutAdmin);
router.get("/session", requireAdmin, getAdminSession);

export default router;
