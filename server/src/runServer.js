import "dotenv/config";
import mongoose from "mongoose";
import app from "./httpApp.js";
import { initializeDatabase } from "./config/initializeDatabase.js";

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await initializeDatabase();

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