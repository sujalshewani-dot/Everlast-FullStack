import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    cartKey: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true, min: 1 },
    quantity: { type: Number, required: true, min: 1 },
    selectedSize: { type: String, default: "" },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    postalCode: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const billingDetailsSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: customerSchema, required: true },
    paymentMethod: { type: String, enum: ["Bank Deposit"], default: "Bank Deposit" },
    billingAddress: { type: String, enum: ["same", "different"], default: "same" },
    billingDetails: { type: billingDetailsSchema, default: null },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true, min: 1 },
    inventoryDeducted: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["Awaiting payment confirmation", "Payment confirmed", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Awaiting payment confirmation",
    },
  },
  { timestamps: true }
);

orderSchema.index({ "customer.email": 1, createdAt: -1 });

export default mongoose.model("Order", orderSchema);
