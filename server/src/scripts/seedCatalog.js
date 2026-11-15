import "dotenv/config";
import { connectDB } from "../config/db.js";
import { ensureCatalogSeeded } from "../config/seedCatalog.js";
import mongoose from "mongoose";

async function seedCatalog() {
  try {
    await connectDB();
    await ensureCatalogSeeded();
  } finally {
    await mongoose.disconnect();
  }
}

seedCatalog().catch((error) => {
  console.error("Catalog seed failed:", error.message);
  process.exitCode = 1;
});
