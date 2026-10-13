import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import customerRoutes from "./routes/customer.routes.js";
import productRoutes from "./routes/product.routes.js";
import cors from "cors";
import wishlistRoutes from "./routes/wishlist.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import adminRoutes from "./routes/admin.routes.js";
dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/cart", cartRoutes);
app.use("/orders",orderRoutes)
app.use("/admin", adminRoutes);

const port = process.env.PORT || 5050;

const env = process.env.dbUrl;

if (!env) {
  console.error("Missing dbUrl environment variable");
} else {
  mongoose
    .connect(env)
    .then(() => {
      console.log("DB Connected");
    })
    .catch((err) => {
      console.error("Database connection failed:", err.message);
    });
}

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.listen(port, (req, res) => {
  console.log(`Server started on port ${port}`);
});
