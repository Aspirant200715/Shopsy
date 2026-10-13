import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchProduct } from "../services/productApi";
import formatPrice from "../utils/formatPrice";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, updateQuantity } from "../features/cart/cartSlice";
import CartNavLink from "../components/CartNavLink";
import { toast } from "react-toastify";

function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartError, setCartError] = useState("");
  const [updatingCart, setUpdatingCart] = useState(false);
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.cartItems);
  const cartItem = cartItems.find((item) => item.product?._id === id);
  const quantity = cartItem?.quantity || 0;

  useEffect(() => {
    const controller = new AbortController();

    fetchProduct(id, controller.signal)
      .then((loadedProduct) => {
        setProduct(loadedProduct);
        setError("");
      })
      .catch((requestError) => {
        if (
          requestError.name !== "CanceledError" &&
          requestError.code !== "ERR_CANCELED"
        ) {
          setError(
            requestError.response?.data?.message ||
              "Something went wrong while loading this product.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  const updateCartQuantity = async (nextQuantity) => {
    if (
      !product ||
      updatingCart ||
      nextQuantity < 1 ||
      nextQuantity > product.stock
    ) {
      return;
    }

    setUpdatingCart(true);
    setCartError("");

    try {
      if (!cartItem) {
        await dispatch(addToCart(product._id)).unwrap();
      } else {
        await dispatch(
          updateQuantity({ productId: product._id, quantity: nextQuantity }),
        ).unwrap();
      }
      toast.success(
        quantity > 0
          ? `${product.name} quantity updated.`
          : `${product.name} added to your cart.`,
      );
    } catch (requestError) {
      const msg =
        typeof requestError === "string"
          ? requestError
          : requestError?.message || "Unable to update your cart.";
      setCartError(msg);
      toast.error(msg);
    } finally {
      setUpdatingCart(false);
    }
  };

  return (
    <div className="home-shell catalog-shell">
      <header className="topbar">
        <Link to="/" className="brand brand-dark">
          <span className="brand-mark">S</span>Shopsy
        </Link>
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link className="active-nav" to="/products">
            Products
          </Link>
          <Link to="/wishlist">Wishlist</Link>
          <CartNavLink />
          <Link to="/orders">Orders</Link>
          <Link to="/logout">Logout</Link>
        </nav>
        <Link to="/products" className="ghost-btn small-btn">
          Back to shop
        </Link>
      </header>

      <main className="details-page">
        {loading && (
          <div className="state-panel">
            <span className="loader-dot" />
            Loading product...
          </div>
        )}
        {!loading && error && (
          <div className="state-panel state-error">
            <strong>We could not find that product.</strong>
            <span>{error}</span>
            <Link className="primary-btn small-btn" to="/products">
              Browse products
            </Link>
          </div>
        )}
        {!loading && !error && product && (
          <article className="details-layout">
            <div className="details-image-panel">
              <div className="details-image-fallback" hidden>{product.name}</div>
              <img
                src={product.image}
                alt={product.name}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  event.currentTarget.previousElementSibling?.removeAttribute("hidden");
                }}
              />
            </div>
            <div className="details-copy">
              <p className="eyebrow">{product.category}</p>
              <h1>{product.name}</h1>
              <p className="details-description">{product.description}</p>
              <div className="details-price">{formatPrice(product.price)}</div>
              <div className="details-stock">
                <span
                  className={
                    product.stock > 0
                      ? "stock-mark"
                      : "stock-mark stock-mark-out"
                  }
                >
                  {product.stock > 0 ? "Available now" : "Currently sold out"}
                </span>
                <span>
                  {product.stock > 0
                    ? `${product.stock} units ready to ship`
                    : "Check back soon for a restock"}
                </span>
              </div>
              {quantity > 0 ? (
                <div className="quantity-control details-quantity-control">
                  <span className="quantity-label">
                    Already in your cart: {quantity}{" "}
                    {quantity === 1 ? "item" : "items"}
                  </span>
                  <div className="quantity-stepper">
                    <button
                      type="button"
                      aria-label={`Decrease ${product.name} quantity`}
                      disabled={updatingCart || quantity <= 1}
                      onClick={() => updateCartQuantity(quantity - 1)}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={product.stock}
                      value={quantity}
                      aria-label={`${product.name} quantity`}
                      disabled={updatingCart}
                      onChange={(event) => {
                        const nextQuantity = Number(event.target.value);
                        if (Number.isInteger(nextQuantity)) {
                          updateCartQuantity(nextQuantity);
                        }
                      }}
                    />
                    <button
                      type="button"
                      aria-label={`Increase ${product.name} quantity`}
                      disabled={updatingCart || quantity >= product.stock}
                      onClick={() => updateCartQuantity(quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <span className="stock-hint">{product.stock} in stock</span>
                </div>
              ) : (
                <button
                  className="primary-btn details-cart"
                  disabled={product.stock === 0 || updatingCart}
                  onClick={() => updateCartQuantity(1)}
                  type="button"
                >
                  {updatingCart ? "Adding..." : "Add to cart"}
                </button>
              )}
              {quantity > 0 && (
                <div className="added-cart-actions">
                  <p className="added-note">
                    This item is already saved in your cart.
                  </p>
                  <Link className="view-cart-link" to="/cart">
                    View cart{" "}
                    <span
                      className="arrow-icon arrow-right"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              )}
              {cartError && <p className="state-error">{cartError}</p>}
              <Link className="details-back" to="/products">
                <svg
                  className="back-arrow"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M16 10H4M9 5l-5 5 5 5" />
                </svg>
                Continue browsing
              </Link>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}

export default ProductDetailsPage;
