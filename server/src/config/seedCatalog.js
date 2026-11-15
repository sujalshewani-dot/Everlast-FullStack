import catalogSeed from "../data/catalogSeed.json" with { type: "json" };
import Product from "../models/Product.js";

export async function ensureCatalogSeeded() {
  const operations = catalogSeed.map((product) => ({
    updateOne: {
      filter: { routeId: product.routeId },
      update: { $setOnInsert: product },
      upsert: true,
    },
  }));
  const result = await Product.bulkWrite(operations, { ordered: true });

  console.log(
    `Catalog ready: ${result.upsertedCount} initial products added; existing records preserved.`
  );
}
