import { connectDB } from "./db.js";
import { ensureCatalogSeeded } from "./seedCatalog.js";
import { migrateLegacyOrderInventory } from "./migrateLegacyOrderInventory.js";

let initialization;

export function initializeDatabase() {
  if (!initialization) {
    initialization = (async () => {
      await connectDB();
      await ensureCatalogSeeded();
      await migrateLegacyOrderInventory();
    })().catch((error) => {
      initialization = undefined;
      throw error;
    });
  }

  return initialization;
}
