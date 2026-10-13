import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useAuth from "../context/useAuth";
import ProductCard from "../components/ProductCard";
import { fetchProducts, fetchWishlist } from "../services/productApi";
import CartNavLink from "../components/CartNavLink";
import StoreFooter from "../components/StoreFooter";

const defaultCategories = ["Electronics", "Fashion", "Books", "Home"];

function StoreHeader() {
  const { customer } = useAuth();

  return (
    <header className="topbar">
      <Link to="/" className="brand brand-dark">
        <span className="brand-mark">S</span>
        Shopsy
      </Link>
      <nav className="nav-links">
        <Link to="/">Home</Link>
        <Link className="active-nav" to="/products">
          Products
        </Link>
        <Link to="/wishlist">Wishlist</Link>
        <CartNavLink />
        <Link to="/orders">Orders</Link>
        {customer?.role === "admin" && <Link to="/admin">Admin</Link>}
        <Link to="/logout">Logout</Link>
      </nav>
      <div className="nav-actions">
        <Link className="profile-nav-link" to="/profile" title="Open your profile">
          {customer?.fullname || "Profile"}
        </Link>
      </div>
    </header>
  );
}

function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sort, setSort] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wishlistIds, setWishlistIds] = useState([]);
  const categories = category
    ? [...new Set([...defaultCategories, category])]
    : defaultCategories;

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    fetchProducts({ search, category, sort }, controller.signal)
      .then((data) => {
        setProducts(data.products || []);
        setError("");
      })
      .catch((requestError) => {
        if (
          requestError.name !== "CanceledError" &&
          requestError.code !== "ERR_CANCELED"
        ) {
          setError("Something went wrong while loading products.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [search, category, sort]);

  useEffect(() => {
    const controller = new AbortController();

    fetchWishlist(controller.signal)
      .then((data) =>
        setWishlistIds(
          (data.wishlist || []).map((product) => product._id),
        ),
      )
      .catch((requestError) => {
        if (
          requestError.name !== "CanceledError" &&
          requestError.code !== "ERR_CANCELED"
        ) {
          setWishlistIds([]);
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="home-shell catalog-shell">
      <StoreHeader />
      <main className="catalog-page">
        <section className="catalog-heading">
          <div>
            <p className="eyebrow">The Shopsy edit</p>
            <h1>Find your next favorite.</h1>
            <p>
              Browse a considered collection of useful, beautiful things for
              everyday living.
            </p>
          </div>
          <div className="catalog-count">
            {loading ? "..." : `${products.length} items`}
          </div>
        </section>

        <section className="catalog-toolbar" aria-label="Product filters">
          <label className="search-field">
            <span aria-hidden="true">/</span>
            <input
              value={searchInput}
              onChange={(event) => {
                setLoading(true);
                setError("");
                setSearchInput(event.target.value);
              }}
              placeholder="Search products..."
              type="search"
            />
          </label>
          <label className="select-field">
            <span className="sr-only">Category</span>
            <select
              value={category}
              onChange={(event) => {
                setLoading(true);
                setError("");
                setCategory(event.target.value);
              }}
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="select-field">
            <span className="sr-only">Sort products</span>
            <select
              value={sort}
              onChange={(event) => {
                setLoading(true);
                setError("");
                setSort(event.target.value);
              }}
            >
              <option value="">Newest first</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </label>
        </section>

        {loading && (
          <div className="state-panel">
            <span className="loader-dot" />
            Loading products...
          </div>
        )}
        {!loading && error && (
          <div className="state-panel state-error">
            <strong>Could not load the collection.</strong>
            <span>{error}</span>
          </div>
        )}
        {!loading && !error && products.length === 0 && (
          <div className="state-panel">
            <strong>No products found.</strong>
            <span>Try a different search or category.</span>
          </div>
        )}
        {!loading && !error && products.length > 0 && (
          <section className="catalog-grid">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                isWishlisted={wishlistIds.includes(product._id)}
                onWishlistAdded={(productId) =>
                  setWishlistIds((currentIds) =>
                    currentIds.includes(productId)
                      ? currentIds
                      : [...currentIds, productId],
                  )
                }
                product={product}
              />
            ))}
          </section>
        )}
      </main>
      <StoreFooter />
    </div>
  );
}

export default ProductsPage;
