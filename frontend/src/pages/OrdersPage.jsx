import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../context/useAuth";
import CartNavLink from "../components/CartNavLink";
import formatPrice from "../utils/formatPrice";
import { getOrders } from "../services/orderApi";

const orderSteps = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

function OrdersPage() {
  const { customer } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    getOrders(controller.signal)
      .then((data) => setOrders(data.orders || []))
      .catch((requestError) => {
        if (
          requestError.name !== "CanceledError" &&
          requestError.code !== "ERR_CANCELED"
        ) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load your orders.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

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
          <Link className="active-nav" to="/orders">
            Orders
          </Link>
          {customer?.role === "admin" && <Link to="/admin">Admin</Link>}
          <Link to="/logout">Logout</Link>
        </nav>
        <div className="nav-actions">
          <Link className="profile-nav-link" to="/profile" title="Open your profile">
            {customer?.fullname || "Profile"}
          </Link>
        </div>
      </header>

      <main className="orders-page">
        <section className="catalog-heading">
          <div>
            <p className="eyebrow">Your Shopsy history</p>
            <h1>My orders.</h1>
            <p>Keep track of everything you have brought home.</p>
          </div>
          <div className="catalog-count">
            {loading ? "..." : `${orders.length} orders`}
          </div>
        </section>

        {loading && (
          <div className="state-panel">
            <span className="loader-dot" />
            Loading your orders...
          </div>
        )}
        {!loading && error && (
          <div className="state-panel state-error">
            <strong>Could not load your orders.</strong>
            <span>{error}</span>
          </div>
        )}
        {!loading && !error && orders.length === 0 && (
          <div className="state-panel">
            <strong>You have not placed any orders yet.</strong>
            <span>Your completed purchases will appear here.</span>
            <Link className="primary-btn small-btn" to="/products">
              Browse products
            </Link>
          </div>
        )}
        {!loading && !error && orders.length > 0 && (
          <section className="orders-list">
            {orders.map((order) => (
              <article className="order-card" key={order._id}>
                <div className="order-card-heading">
                  <div>
                    <p className="eyebrow">Order placed</p>
                    <h2>#{order._id.slice(-8).toUpperCase()}</h2>
                  </div>
                  <span className="order-status">{order.orderStatus}</span>
                </div>
                <div className="order-card-details">
                  <div>
                    <span>Total</span>
                    <strong>{formatPrice(order.totalAmount)}</strong>
                  </div>
                  <div>
                    <span>Payment</span>
                    <strong>{order.paymentStatus}</strong>
                  </div>
                  <div>
                    <span>Items</span>
                    <strong>{order.items.length}</strong>
                  </div>
                </div>
                <div className="order-progress">
                  <h3>Order status</h3>
                  <div className="order-progress-steps">
                    {orderSteps.map((step, index) => {
                      const currentIndex = orderSteps.indexOf(order.orderStatus);
                      const isComplete =
                        currentIndex >= 0 && index <= currentIndex;
                      const isCurrent =
                        currentIndex >= 0 && index === currentIndex;

                      return (
                        <div
                          className={`order-progress-step ${
                            isComplete ? "is-complete" : ""
                          } ${isCurrent ? "is-current" : ""}`}
                          key={step}
                        >
                          <span className="order-progress-marker">
                            {isComplete ? "✓" : "○"}
                          </span>
                          <span>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="order-items">
                  {order.items.map((item) => (
                    <span key={`${order._id}-${item.product?._id || item.name}`}>
                      {item.name} × {item.quantity}
                    </span>
                  ))}
                </div>
                <Link className="primary-btn small-btn order-view-link" to={`/orders/${order._id}`}>
                  View order
                </Link>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default OrdersPage;
