import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CartNavLink from "../components/CartNavLink";
import formatPrice from "../utils/formatPrice";
import {
  createPaymentOrderForExistingOrder,
  getOrderById,
  verifyPayment,
} from "../services/orderApi";
import { toast } from "react-toastify";

const orderSteps = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

function OrderItemImage({ item }) {
  const [imageFailed, setImageFailed] = useState(!item.image);

  if (imageFailed) {
    return (
      <div className="order-item-image order-item-image-placeholder">
        <span>{item.name.slice(0, 1).toUpperCase()}</span>
        <small>Shopsy item</small>
      </div>
    );
  }

  return (
    <img
      className="order-item-image"
      src={item.image}
      alt={item.name}
      onError={() => setImageFailed(true)}
    />
  );
}

function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    getOrderById(id, controller.signal)
      .then((data) => setOrder(data.order))
      .catch((requestError) => {
        if (
          requestError.name !== "CanceledError" &&
          requestError.code !== "ERR_CANCELED"
        ) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load this order.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  const completePayment = async () => {
    setPaymentLoading(true);
    setPaymentError("");

    try {
      if (!window.Razorpay) {
        throw new Error("Payment checkout is unavailable. Please try again.");
      }

      const data = await createPaymentOrderForExistingOrder(id);
      const razorpay = new window.Razorpay({
        key: data.razorpay.keyId,
        amount: data.razorpay.amount,
        currency: data.razorpay.currency,
        name: "ShopKart",
        description: "Complete payment for your Shopsy order",
        order_id: data.razorpay.orderId,
        handler: async (response) => {
          try {
            await verifyPayment(response);
            const refreshedOrder = await getOrderById(id);
            setOrder(refreshedOrder.order);
            toast.success("Payment completed successfully!");
          } catch (requestError) {
            const message =
              requestError.response?.data?.message ||
              requestError.message ||
              "Payment verification failed. Please try again.";
            setPaymentError(message);
            toast.error(message);
          }
        },
        prefill: {
          name: order.shippingAddress.fullName,
          contact: order.shippingAddress.phone,
        },
        theme: {
          color: "#c7f36b",
        },
      });

      razorpay.open();
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        requestError.message ||
        "Unable to start payment.";
      setPaymentError(message);
      toast.error(message);
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="home-shell catalog-shell">
      <header className="topbar">
        <Link to="/" className="brand brand-dark">
          <span className="brand-mark">S</span>
          Shopsy
        </Link>
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/wishlist">Wishlist</Link>
          <CartNavLink />
          <Link className="active-nav" to="/orders">Orders</Link>
          <Link to="/logout">Logout</Link>
        </nav>
      </header>

      <main className="order-details-page">
        {loading && (
          <div className="state-panel">
            <span className="loader-dot" />
            Loading order...
          </div>
        )}
        {!loading && error && (
          <div className="state-panel state-error">
            <strong>Could not load this order.</strong>
            <span>{error}</span>
            <Link className="primary-btn small-btn" to="/orders">Back to orders</Link>
          </div>
        )}
        {!loading && !error && !order && (
          <div className="state-panel">
            <strong>Order not found.</strong>
            <Link className="primary-btn small-btn" to="/orders">Back to orders</Link>
          </div>
        )}
        {!loading && !error && order && (
          <>
            <section className="catalog-heading order-details-heading">
              <div>
                <p className="eyebrow">Order details</p>
                <h1>#{order._id.slice(-8).toUpperCase()}</h1>
                <p>Here is everything you need to know about this order.</p>
              </div>
              <Link className="ghost-btn small-btn" to="/orders">Back to orders</Link>
            </section>
            <div className="order-details-layout">
              <section className="order-detail-card">
                <div className="order-detail-status">
                  <div><span className="detail-label">Payment</span><strong>{order.paymentStatus}</strong></div>
                  <div><span className="detail-label">Order status</span><strong>{order.orderStatus}</strong></div>
                </div>
                {order.paymentStatus !== "PAID" && order.orderStatus === "PENDING_PAYMENT" && (
                  <div className="pending-payment-panel">
                    <div>
                      <strong>Payment is still pending</strong>
                      <span>Complete your payment to place this order.</span>
                    </div>
                    <button
                      className="primary-btn small-btn"
                      disabled={paymentLoading}
                      onClick={completePayment}
                      type="button"
                    >
                      {paymentLoading ? "Opening checkout..." : "Complete payment"}
                    </button>
                    {paymentError && <p className="wishlist-error">{paymentError}</p>}
                  </div>
                )}
                <div className="order-progress">
                  <h3>Order status</h3>
                  <div className="order-progress-steps">
                    {orderSteps.map((step, index) => {
                      const currentIndex = orderSteps.indexOf(order.orderStatus);
                      const isComplete = currentIndex >= 0 && index <= currentIndex;
                      const isCurrent = currentIndex >= 0 && index === currentIndex;
                      return (
                        <div className={`order-progress-step ${isComplete ? "is-complete" : ""} ${isCurrent ? "is-current" : ""}`} key={step}>
                          <span className="order-progress-marker">{isComplete ? "✓" : "○"}</span>
                          <span>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <h2>Items</h2>
                <div className="order-detail-items">
                  {order.items.map((item) => (
                    <article className="order-detail-item" key={`${item.product?._id || item.name}-${item.quantity}`}>
                      <OrderItemImage item={item} />
                      <div><h3>{item.name}</h3><p>{formatPrice(item.price)} × {item.quantity}</p></div>
                      <strong>{formatPrice(item.price * item.quantity)}</strong>
                    </article>
                  ))}
                </div>
                <div className="order-detail-total">
                  <span>Total</span><strong>{formatPrice(order.totalAmount)}</strong>
                </div>
              </section>
              <aside className="order-detail-card shipping-card">
                <p className="eyebrow">Delivery</p>
                <h2>Shipping address</h2>
                <p>{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                <p>{order.shippingAddress.pincode}</p>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default OrderDetailsPage;