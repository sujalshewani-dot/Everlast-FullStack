import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createContactMessage,
  subscribeToNewsletter,
} from "../controllers/submissionController.js";
import { validateBody } from "../middleware/validateBody.js";
import {
  contactMessageSchema,
  newsletterSchema,
} from "../validation/submissionSchemas.js";

const router = Router();
const submissionLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      message: "Too many submissions. Please try again later.",
    }),
});

router.post(
  "/contact",
  submissionLimit,
  validateBody(contactMessageSchema),
  createContactMessage
);
router.post(
  "/newsletter",
  submissionLimit,
  validateBody(newsletterSchema),
  subscribeToNewsletter
);

export default router;
