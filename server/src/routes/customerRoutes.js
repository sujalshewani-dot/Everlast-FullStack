import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  listCustomerOrders,
  requestCustomerCode,
  verifyCustomerCode,
} from "../controllers/customerController.js";
import { requireCustomer } from "../middleware/requireCustomer.js";
import { validateBody } from "../middleware/validateBody.js";
import {
  customerCodeSchema,
  customerEmailSchema,
} from "../validation/customerSchemas.js";

const router = Router();

const requestCodeLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      message: "Too many sign-in codes requested. Try again later.",
    }),
});

const verifyCodeLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      message: "Too many sign-in attempts. Try again later.",
    }),
});

router.post(
  "/request-code",
  requestCodeLimit,
  validateBody(customerEmailSchema),
  requestCustomerCode
);
router.post(
  "/verify-code",
  verifyCodeLimit,
  validateBody(customerCodeSchema),
  verifyCustomerCode
);
router.get("/orders", requireCustomer, listCustomerOrders);

export default router;
