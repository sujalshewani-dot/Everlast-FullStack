import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createOrder } from "../controllers/orderController.js";
import { validateBody } from "../middleware/validateBody.js";
import { createOrderSchema } from "../validation/submissionSchemas.js";

const router = Router();

router.post(
  "/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({
        success: false,
        message: "Too many order attempts. Please try again later.",
      }),
  }),
  validateBody(createOrderSchema),
  createOrder
);

export default router;
