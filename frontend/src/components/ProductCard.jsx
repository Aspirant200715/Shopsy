import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToWishlist } from "../services/productApi";
import { addToCart, updateQuantity } from "../features/cart/cartSlice";
import formatPrice from "../utils/formatPrice";
import { toast } from "react-toastify";

function ProductCard({
  product,
  onRemove,
  removing = false,
  isWishlisted = false,
  onWishlistAdded,
}) {
  const isOutOfStock = product.stock === 0;
  const isWishlistCard = typeof onRemove === "function";
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.cartItems);
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState(isWishlisted);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(!product.image);
  const [updatingCart, setUpdatingCart] = useState(false);
  const cartItem = cartItems.find(
    (item) => item.product?._id === product._id,
  );
  const quantity = cartItem?.quantity || 0;

  const handleWishlist = async () => {
    if (saving || added) return;

    setSaving(true);
    setError("");

    try {
      await addToWishlist(product._id);
      setAdded(true);
      onWishlistAdded?.(product._id);
      toast.success(`${product.name} added to your wishlist.`);
    } catch (requestError) {
      const message =
        requestError.response?.status === 409
          ? "Already in your wishlist."
          : requestError.response?.data?.message ||
            "Unable to save product. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const updateCartQuantity = async (nextQuantity) => {
    if (updatingCart || nextQuantity < 1 || nextQuantity > product.stock) {
      return;
    }

    setUpdatingCart(true);
    setError("");

    try {
      if (!cartItem) {
        await dispatch(addToCart(product._id)).unwrap();
      } else if (nextQuantity > quantity) {
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
      setError(
        typeof requestError === "string"
          ? requestError
          : requestError?.message || "Unable to update your cart.",
      );
      toast.error(
        typeof requestError === "string"
          ? requestError
          : requestError?.message || "Unable to update your cart.",
      );
    } finally {
      setUpdatingCart(false);
    }
  };

  return (
    <article className="catalog-card">
      <div className="catalog-image-wrap">
        {imageFailed ? (
          <div className="catalog-image-placeholder" aria-label={product.name}>
            <span>{product.name.slice(0, 1).toUpperCase()}</span>
            <small>Shopsy selection</small>
          </div>
        ) : (
          <img
            className="catalog-image"
            src={product.image}
            alt={product.name}
            onError={() => setImageFailed(true)}
          />
        )}
        <span className={`stock-chip ${isOutOfStock ? "stock-chip-out" : ""}`}>
          {isOutOfStock ? "Sold out" : "In stock"}
        </span>
      </div>
      <div className="catalog-info">
        <p className="catalog-category">{product.category}</p>
        <h2>{product.name}</h2>
        <p className="catalog-description">{product.description}</p>
        <div className="catalog-meta">
          <strong>{formatPrice(product.price)}</strong>
          <span>
            {isOutOfStock ? "Unavailable" : `${product.stock} units left`}
          </span>
        </div>
        <Link
          className="primary-btn small-btn catalog-link"
          to={`/products/${product._id}`}
        >
          View details <span className="arrow-icon arrow-right" aria-hidden="true" />
        </Link>
        {quantity > 0 ? (
          <div className="quantity-control card-quantity-control">
            <span className="quantity-label">In your cart</span>
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
            className="cart-card-action"
            disabled={isOutOfStock || updatingCart}
            onClick={() => updateCartQuantity(1)}
            type="button"
          >
            {updatingCart ? "Adding..." : "Add to cart"}
          </button>
        )}
        {isWishlistCard ? (
          <button
            className="wishlist-action"
            disabled={removing}
            onClick={() => onRemove(product._id)}
            type="button"
          >
            {removing ? "Removing..." : "Remove from Wishlist"}
          </button>
        ) : (
          <button
            className="wishlist-action"
            disabled={saving || added}
            onClick={handleWishlist}
            type="button"
          >
            {saving
              ? "Saving..."
              : added
                ? "Already in Wishlist"
                : "Add to Wishlist"}
          </button>
        )}
        {error && <p className="wishlist-error">{error}</p>}
      </div>
    </article>
  );
}

export default ProductCard;
