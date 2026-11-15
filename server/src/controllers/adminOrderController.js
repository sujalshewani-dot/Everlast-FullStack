import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

const orderStatuses = [
  "Awaiting payment confirmation",
  "Payment confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const statusTransitions = {
  "Awaiting payment confirmation": ["Payment confirmed", "Cancelled"],
  "Payment confirmed": ["Processing", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

export function canTransitionOrderStatus(currentStatus, nextStatus) {
  return statusTransitions[currentStatus]?.includes(nextStatus) ?? false;
}

export function getInventoryAdjustments(order, nextStatus) {
  const shouldDeduct =
    nextStatus === "Payment confirmed" && !order.inventoryDeducted;
  const shouldRestore =
    nextStatus === "Cancelled" && order.inventoryDeducted;

  if (!shouldDeduct && !shouldRestore) return [];

  return order.items.map((item) => ({
    routeId: item.productId,
    stockField: item.selectedSize === "110 ML" ? "stock110" : "stock55",
    quantity: (shouldDeduct ? -1 : 1) * item.quantity,
  }));
}

export async function listOrders(req, res) {
  const requestedStatus = req.query.status;
  if (requestedStatus && !orderStatuses.includes(requestedStatus)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order status.",
    });
  }

  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
  const filter = requestedStatus ? { status: requestedStatus } : {};
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return res.json({
    success: true,
    data: orders,
    pagination: { page, limit, total },
  });
}

export async function updateOrderStatus(req, res) {
  const session = await mongoose.startSession();
  let order;

  try {
    await session.withTransaction(async () => {
      order = await Order.findOne({ orderNumber: req.params.orderNumber }).session(session);
      if (!order) {
        const error = new Error("Order not found.");
        error.status = 404;
        throw error;
      }

      const nextStatus = req.body.status;
      if (nextStatus === order.status) return;

      if (!canTransitionOrderStatus(order.status, nextStatus)) {
        const error = new Error(
          `Order status cannot move from ${order.status} to ${nextStatus}.`
        );
        error.status = 409;
        throw error;
      }

      for (const adjustment of getInventoryAdjustments(order, nextStatus)) {
        const filter = { routeId: adjustment.routeId };
        if (adjustment.quantity < 0) {
          filter[adjustment.stockField] = { $gte: -adjustment.quantity };
        }

        const result = await Product.updateOne(
          filter,
          { $inc: { [adjustment.stockField]: adjustment.quantity } },
          { session }
        );

        if (result.modifiedCount !== 1) {
          const error = new Error(
            "There is not enough stock to confirm payment for this order."
          );
          error.status = 409;
          throw error;
        }
      }

      if (nextStatus === "Payment confirmed") order.inventoryDeducted = true;
      if (nextStatus === "Cancelled") order.inventoryDeducted = false;
      order.status = nextStatus;
      await order.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return res.json({ success: true, data: order });
}
