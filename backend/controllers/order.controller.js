import "dotenv/config";
import mongoose from "mongoose";
import Customer from "../models/customer.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Razorpay from "razorpay";
import crypto from "crypto";

let razorpay;
const getRazorpay = () => {
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

const createRazorpayOrder = async (order) => {
  const razorpayOrder = await getRazorpay().orders.create({
    amount: Math.round(order.totalAmount * 100),
    currency: "INR",
    receipt: order._id.toString(),
  });

  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  return razorpayOrder;
};

export const createPaymentOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping Address is required",
      });
    }

    const { fullName, phone, addressLine1, city, state, pincode } =
      shippingAddress;

    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({
        message: "All the fields are required",
      });
    }

    const customer = await Customer.findById(req.user._id).populate(
      "cart.product",
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (!customer.cart || customer.cart.length === 0) {
      return res.status(400).json({
        message: "Cart is Empty",
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const cartItem of customer.cart) {
      const product = cartItem.product;

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "One of the product in your cart no longer exists",
        });
      }

      if (cartItem.quantity > product.stock) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}`,
        });
      }

      const itemTotal = product.price * cartItem.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image,
      });
    }

    const order = await Order.create({
      user: customer._id,

      items: orderItems,

      shippingAddress: {
        fullName,
        phone,
        addressLine1,
        city,
        state,
        pincode,
      },

      totalAmount,

      paymentStatus: "PENDING",
      orderStatus: "PENDING_PAYMENT",
    });

    const razorpayOrder = await createRazorpayOrder(order);
    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        id: order._id,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      },

      razorpay: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    return res.status(500).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
};

export const createPaymentOrderForExistingOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus === "PAID" || order.orderStatus !== "PENDING_PAYMENT") {
      return res.status(409).json({
        message: "This order is no longer awaiting payment.",
      });
    }

    const razorpayOrder = await createRazorpayOrder(order);

    return res.status(200).json({
      success: true,
      order: {
        id: order._id,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      },
      razorpay: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Create pending payment order error:", error);

    return res.status(500).json({
      message: "Failed to start payment",
      error: error.message,
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string" ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "Incomplete payment information",
      });
    }

    const order = await Order.findOne({
      razorpayOrderId: razorpay_order_id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(200).json({
        success: true,
        message: "Payment was already verified",
        order: {
          id: order._id,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
        },
      });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const signaturesMatch =
      expectedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(razorpay_signature),
      );

    if (!signaturesMatch) {
      order.paymentStatus = "FAILED";
      await order.save();

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const item of order.items) {
          const updatedProduct = await Product.findOneAndUpdate(
            {
              _id: item.product,
              stock: { $gte: item.quantity },
            },
            { $inc: { stock: -item.quantity } },
            { returnDocument: "after", session },
          );

          if (!updatedProduct) {
            const stockError = new Error(
              `Insufficient stock for ${item.name}.`,
            );
            stockError.code = "INSUFFICIENT_STOCK";
            throw stockError;
          }
        }

        order.paymentStatus = "PAID";
        order.orderStatus = "PLACED";
        order.razorpayPaymentId = razorpay_payment_id;
        order.razorpaySignature = razorpay_signature;
        await order.save({ session });

        await Customer.updateOne(
          { _id: req.user._id },
          { $set: { cart: [] } },
          { session },
        );
      });
    } catch (transactionError) {
      if (transactionError.code === "INSUFFICIENT_STOCK") {
        return res.status(409).json({
          success: false,
          message: transactionError.message,
        });
      }
      throw transactionError;
    } finally {
      await session.endSession();
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order: {
        id: order._id,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return res.status(500).json({
      message: "Payment verification failed",
      error: error.message,
    });
  }
};


export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    })
      .populate("items.product", "name price image category")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};


export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      user: req.user._id,
    }).populate("items.product", "name price image category");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedTransitions = {
      PLACED: "CONFIRMED",
      CONFIRMED: "SHIPPED",
      SHIPPED: "DELIVERED",
    };

    const order = await Order.findOne({
      _id: id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const nextStatus = allowedTransitions[order.orderStatus];

    if (!nextStatus) {
      return res.status(400).json({
        message: "Order cannot be progressed further",
      });
    }

    if (status !== nextStatus) {
      return res.status(400).json({
        message: `Invalid status transition. ${order.orderStatus} can only become ${nextStatus}`,
      });
    }

    order.orderStatus = status;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      message: "Failed to update order status",
      error: error.message,
    });
  }
};