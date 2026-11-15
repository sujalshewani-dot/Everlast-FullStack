import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

function createOrderNumber() {
  return `EV-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export function getPriceForSize(product, selectedSize) {
  return selectedSize === "110 ML" ? product.price * 2 : product.price;
}

export async function createOrder(req, res) {
  const session = await mongoose.startSession();
  let order;

  try {
    await session.withTransaction(async () => {
      const items = [];
      let subtotal = 0;

      for (const requestedItem of req.body.items) {
        const product = await Product.findOne({
          routeId: requestedItem.productId,
          isActive: true,
        }).session(session);

        if (!product) {
          const error = new Error(
            `Product ${requestedItem.productId} is no longer available.`
          );
          error.status = 409;
          throw error;
        }

        const stockField =
          requestedItem.selectedSize === "110 ML" ? "stock110" : "stock55";
        const price = getPriceForSize(product, requestedItem.selectedSize);

        if (requestedItem.expectedPrice !== price) {
          const error = new Error(
            `${product.name}'s price changed. Refresh the cart before ordering.`
          );
          error.status = 409;
          throw error;
        }

        if (product[stockField] < requestedItem.quantity) {
          const error = new Error(`${product.name} does not have enough stock.`);
          error.status = 409;
          throw error;
        }

        items.push({
          productId: product.routeId,
          cartKey: `${product.routeId}-${requestedItem.selectedSize}`,
          name: product.name,
          image: product.image,
          price,
          quantity: requestedItem.quantity,
          selectedSize: requestedItem.selectedSize,
        });
        subtotal += price * requestedItem.quantity;
      }

      [order] = await Order.create(
        [
          {
            ...req.body,
            orderNumber: createOrderNumber(),
            items,
            subtotal,
            total: subtotal,
            paymentMethod: "Bank Deposit",
            inventoryDeducted: false,
            status: "Awaiting payment confirmation",
          },
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return res.status(201).json({
    success: true,
    message: "Your order has been received.",
    data: order,
  });
}
