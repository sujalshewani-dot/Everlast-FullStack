import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    routeId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    image: { type: String, required: true, trim: true, maxlength: 500 },
    category: {
      type: String,
      required: true,
      enum: ["men", "women", "new", "premium", "home"],
    },
    price: { type: Number, required: true, min: 1, max: 10000000 },
    stock55: { type: Number, required: true, min: 0, default: 0 },
    stock110: { type: Number, required: true, min: 0, default: 0 },
    reviews: { type: Number, min: 0, default: 0 },
    bottleLabel: { type: String, trim: true, maxlength: 160, default: "" },
    priceFrom: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, isActive: 1, sortOrder: 1 });

export default mongoose.model("Product", productSchema);

export function serializeProduct(product) {
  const record = product.toObject ? product.toObject() : product;
  const { _id, __v, ...fields } = record;

  return {
    ...fields,
    productId: fields.routeId,
    price110: fields.price * 2,
    soldOut: fields.stock55 === 0 && fields.stock110 === 0,
    available55: fields.stock55 > 0,
    available110: fields.stock110 > 0,
  };
}
