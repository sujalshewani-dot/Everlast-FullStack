import { randomBytes } from "node:crypto";
import Product, { serializeProduct } from "../models/Product.js";

export async function listProducts(req, res) {
  const filter = { isActive: true };
  if (req.query.category) filter.category = req.query.category;

  const products = await Product.find(filter).sort({ sortOrder: 1, name: 1 });
  return res.json({
    success: true,
    data: products.map(serializeProduct),
  });
}

export async function getProduct(req, res) {
  const product = await Product.findOne({
    routeId: req.params.routeId,
    isActive: true,
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found.",
    });
  }

  return res.json({ success: true, data: serializeProduct(product) });
}

export async function listAdminProducts(req, res) {
  const products = await Product.find().sort({ category: 1, sortOrder: 1, name: 1 });
  return res.json({
    success: true,
    data: products.map(serializeProduct),
  });
}

function createRouteId(category, name) {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${category}-${slug || randomBytes(4).toString("hex")}`;
}

export async function createProduct(req, res) {
  const routeId = createRouteId(req.body.category, req.body.name);
  const existing = await Product.exists({ routeId });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: "A product with this name already exists in that collection.",
    });
  }

  const product = await Product.create({ ...req.body, routeId });
  return res.status(201).json({
    success: true,
    data: serializeProduct(product),
  });
}

export async function updateProduct(req, res) {
  const product = await Product.findOneAndUpdate(
    { routeId: req.params.routeId },
    { $set: req.body },
    { returnDocument: "after", runValidators: true }
  );

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found.",
    });
  }

  return res.json({ success: true, data: serializeProduct(product) });
}

export async function archiveProduct(req, res) {
  const product = await Product.findOneAndUpdate(
    { routeId: req.params.routeId },
    { $set: { isActive: false } },
    { returnDocument: "after" }
  );

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found.",
    });
  }

  return res.json({
    success: true,
    message: "Product removed from the storefront.",
    data: serializeProduct(product),
  });
}
