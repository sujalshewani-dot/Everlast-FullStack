import { Router } from "express";
import {
  archiveProduct,
  createProduct,
  listAdminProducts,
  updateProduct,
} from "../controllers/productController.js";
import {
  listContactMessages,
  updateContactStatus,
} from "../controllers/submissionController.js";
import {
  listOrders,
  updateOrderStatus,
} from "../controllers/adminOrderController.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { validateBody } from "../middleware/validateBody.js";
import {
  orderStatusSchema,
  contactStatusSchema,
  productInputSchema,
  productUpdateSchema,
} from "../validation/adminSchemas.js";

const router = Router();

router.use(requireAdmin);
router.get("/products", listAdminProducts);
router.post("/products", validateBody(productInputSchema), createProduct);
router.patch(
  "/products/:routeId",
  validateBody(productUpdateSchema),
  updateProduct
);
router.delete("/products/:routeId", archiveProduct);
router.get("/contacts", listContactMessages);
router.patch(
  "/contacts/:id/status",
  validateBody(contactStatusSchema),
  updateContactStatus
);
router.get("/orders", listOrders);
router.patch(
  "/orders/:orderNumber/status",
  validateBody(orderStatusSchema),
  updateOrderStatus
);

export default router;
