import Order from "../models/Order.js";

export async function migrateLegacyOrderInventory() {
  await Order.updateMany(
    { inventoryDeducted: { $exists: false } },
    { $set: { inventoryDeducted: true } }
  );
}
