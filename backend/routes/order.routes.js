import express from "express";
import isAuthenticated, { isAdmin } from "../middlewares/auth.middleware.js";
import {
  createPaymentOrder,
  createPaymentOrderForExistingOrder,
  verifyPayment,
  getOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controller.js";

const orderRoutes = express.Router();

orderRoutes.post("/create-payment-order", isAuthenticated, createPaymentOrder);
orderRoutes.post("/verify-payment", isAuthenticated, verifyPayment);
orderRoutes.post("/:id/create-payment-order", isAuthenticated, createPaymentOrderForExistingOrder);
orderRoutes.get("/", isAuthenticated, getOrders);
orderRoutes.get("/:id", isAuthenticated, getOrderById);
orderRoutes.patch("/:id/status", isAuthenticated, isAdmin, updateOrderStatus);
export default orderRoutes;
