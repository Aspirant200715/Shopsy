import axiosInstance from "../axiosCalls/axios";

export const createPaymentOrder = async (shippingAddress) => {
  const response = await axiosInstance.post("/orders/create-payment-order", {
    shippingAddress,
  });

  return response.data;
};

export const verifyPayment = async (paymentResponse) => {
  const response = await axiosInstance.post(
    "/orders/verify-payment",
    paymentResponse,
  );

  return response.data;
};

export const createPaymentOrderForExistingOrder = async (orderId) => {
  const response = await axiosInstance.post(
    `/orders/${orderId}/create-payment-order`,
  );

  return response.data;
};

export const getOrders = async (signal) => {
  const response = await axiosInstance.get("/orders", { signal });
  return response.data;
};

export const getOrderById = async (orderId, signal) => {
  const response = await axiosInstance.get(`/orders/${orderId}`, { signal });
  return response.data;
};