import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { isDatabaseConnected } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error("Origin is not allowed by CORS.");
      error.status = 403;
      return callback(error);
    },
  })
);
app.use(express.json({ limit: "20kb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      }),
  })
);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Everlast API is running.",
    endpoints: {
      health: "GET /api/health",
      products: "GET /api/products",
      orders: "POST /api/orders",
      contact: "POST /api/contact",
      newsletter: "POST /api/newsletter",
      admin: "/api/admin",
    },
  });
});

app.get("/api/health", (req, res) => {
  const ready = isDatabaseConnected();

  res.status(ready ? 200 : 503).json({
    success: ready,
    status: ready ? "ok" : "database_unavailable",
  });
});

app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api", submissionRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `No route found for ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);

export default app;
