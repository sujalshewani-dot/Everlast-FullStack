import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { ensureCatalogSeeded } from "./config/seedCatalog.js";
import { migrateLegacyOrderInventory } from "./config/migrateLegacyOrderInventory.js";

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await connectDB();
    await ensureCatalogSeeded();
    await migrateLegacyOrderInventory();

    const server = app.listen(PORT, () => {
      console.log(`Everlast API running on http://localhost:${PORT}`);
    });

    for (const signal of ["SIGINT", "SIGTERM"]) {
      process.once(signal, () => {
        server.close(async () => {
          try {
            await mongoose.disconnect();
          } catch (error) {
            console.error("MongoDB shutdown failed:", error.message);
            process.exitCode = 1;
          }
        });
      });
    }
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exitCode = 1;
  }
}

startServer();