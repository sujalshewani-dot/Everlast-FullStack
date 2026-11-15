import express from "express";
import app from "./src/httpApp.js";
import { initializeDatabase } from "./src/config/initializeDatabase.js";

const vercelApp = express();

vercelApp.use(async (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    await initializeDatabase();
  } catch (error) {
    console.error("API database initialization failed:", error);
    return res.status(503).json({
      success: false,
      message: "The API could not connect to its database.",
    });
  }

  return next();
});

vercelApp.use(app);

export default vercelApp;
