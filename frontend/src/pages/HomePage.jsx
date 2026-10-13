import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../context/useAuth";
import CartNavLink from "../components/CartNavLink";
import { fetchProducts } from "../services/productApi";
import formatPrice from "../utils/formatPrice";
import StoreFooter from "../components/StoreFooter";

const benefits = [
  { target: 24, suffix: "h", label: "fast dispatch" },
  { target: 12, suffix: "k+", label: "happy clients" },
  { target: 4.9, decimals: 1, suffix: "", label: "average rating" },
];

const reviews = [
  {
    text: "Clean design, premium feel, and everything feels styled for real living.",
    author: "Mila S.",
  },
  {
    text: "Shopsy feels like a boutique store made for beautiful everyday routines.",
    author: "Rohan K.",
  },
  {
    text: "The product curation is thoughtful and the whole experience feels elevated.",
    author: "Aisha T.",
  },
];

const collectionImages = [
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85",
];

const heroImages = {
  featured:
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=700&q=85",
  trending:
    "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=700&q=85",
};

function AnimatedMetric({ target, decimals = 0, suffix = "" }) {
  const [value, setValue] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? target : 0,
  );

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      return undefined;
    }

    let frameId;
    const startedAt = performance.now();
    const duration = 1200;

    const animate = (timestamp) => {
      const progress = Math.min((timestamp - startedAt) / duration, 1);
      const easedProgress = 1 - (1 - progress) ** 3;
      setValue(target * easedProgress);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [target]);

  return (
    <>
      {value.toFixed(decimals)}
      {suffix}
    </>
  );
}

function HomePage() {
  const { customer } = useAuth();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetchProducts({}, controller.signal)
      .then((data) => {
        setProducts(data.products || []);
        setProductsError("");
      })
      .catch((requestError) => {
        if (
          requestError.name !== "CanceledError" &&
          requestError.code !== "ERR_CANCELED"
        ) {
          setProductsError("Unable to load the latest products.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setProductsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const categories = [...new Set(products.map((product) => product.category))];
  const collections = categories.slice(0, 3).map((category, index) => ({
    name: category,
    tone: ["warm", "soft", "cool"][index],
    tag: `${products.filter((product) => product.category === category).length} products`,
  }));
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="home-shell">
      <header className="topbar">
        <Link to="/" className="brand ">
          <span className="brand-mark">S</span>
          Shopsy
        </Link>

        <nav className="nav-links">
          <Link className="active-nav" to="/">
            Home
          </Link>
          <Link to="/products">Products</Link>
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

      <main className="landing-page">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="pill pill-soft">New season / 2026</span>
            <h1>Make room for things you love.</h1>
            <p>
              A considered edit of home, style, and everyday essentials. Find
              something useful, beautiful, and completely yours.
            </p>

            <div className="account-summary">
              <strong>{customer?.fullname}</strong>
              <span>{customer?.email}</span>
            </div>

            <div className="cta-row">
              <Link to="/products" className="primary-btn">
                Shop now
              </Link>
              <Link to="/wishlist" className="ghost-btn">
                View wishlist
              </Link>
            </div>

            <div className="feature-strip">
              {benefits.map((item) => (
                <div key={item.label} className="feature-item">
                  <strong>
                    <AnimatedMetric
                      target={item.target}
                      decimals={item.decimals}
                      suffix={item.suffix}
                    />
                  </strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual-wrap">
            <div
              className="hero-product-card big-card"
              style={{ backgroundImage: `url(${heroImages.featured})` }}
            >
              <div className="hero-card-scrim" />
              <span className="mini-label">Best seller</span>
              <h3>Aura Chair</h3>
              <strong>$289</strong>
              <small>Live beautifully</small>
            </div>

            <div className="floating-pill floating-pill-top">
              <span>4.9/5</span>
              <small>Top rated</small>
            </div>

            <div
              className="hero-product-card small-card"
              style={{ backgroundImage: `url(${heroImages.trending})` }}
            >
              <div className="hero-card-scrim" />
              <span className="mini-label">Trending</span>
              <h3>Desk set</h3>
              <strong>$149</strong>
            </div>
          </div>
        </section>

        <section className="category-row">
          {categories.map((category) => (
            <Link
              key={category}
              to={`/products?category=${encodeURIComponent(category)}`}
              className="category-pill"
            >
              {category}
            </Link>
          ))}
        </section>

        <section className="collection-grid">
          {collections.map((item, index) => (
            <article
              key={item.name}
              className={`collection-card ${item.tone}`}
              style={{ backgroundImage: `url(${collectionImages[index]})` }}
            >
              <img
                className="collection-card-image"
                src={collectionImages[index]}
                alt={`${item.name} collection`}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <div className="collection-card-scrim" />
              <span>{item.tag}</span>
              <h3>{item.name}</h3>
              <Link to="/products">Shop collection <span aria-hidden="true">↗</span></Link>
            </article>
          ))}
        </section>

        <section className="product-showcase">
          <div className="section-heading">
            <div>
              <p className="eyebrow ">Popular picks</p>
              <h2>Curated for real life</h2>
            </div>
            <Link to="/products" className="mini-link">
              View all
            </Link>
          </div>

          {productsLoading && (
            <div className="state-panel">
              <span className="loader-dot" />
              Loading the latest products...
            </div>
          )}
          {!productsLoading && productsError && (
            <div className="state-panel state-error">
              <strong>Products are unavailable right now.</strong>
              <span>{productsError}</span>
            </div>
          )}
          {!productsLoading && !productsError && featuredProducts.length === 0 && (
            <div className="state-panel">
              <strong>No products have been added yet.</strong>
              <span>New products will appear here as soon as they are created.</span>
            </div>
          )}
          {!productsLoading && !productsError && featuredProducts.length > 0 && (
            <div className="product-grid">
            {featuredProducts.map((product) => (
              <article key={product._id} className="product-card">
                <div className="product-visual product-visual-live">
                  <img
                    className="product-visual-image"
                    src={product.image}
                    alt={product.name}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                  <span>{product.stock > 0 ? "In stock" : "Sold out"}</span>
                </div>
                <div className="product-info">
                  <p>{product.category}</p>
                  <h3>{product.name}</h3>
                  <div className="product-meta">
                    <strong>{formatPrice(product.price)}</strong>
                    <Link to={`/products/${product._id}`} className="product-view-link">
                      Explore <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
            </div>
          )}
        </section>

        <section className="admin-preview-section">
          <div className="admin-preview-copy">
            <p className="eyebrow">For the people behind Shopsy</p>
            <h2>A calmer way to run your store.</h2>
            <p>
              The Admin Studio keeps products, orders, customers, and revenue
              in one clear workspace.
            </p>
            {customer?.role === "admin" && (
              <Link to="/admin" className="primary-btn small-btn">
                Open Admin Studio <span aria-hidden="true">↗</span>
              </Link>
            )}
          </div>
          <div className="admin-preview-window" aria-label="Preview of the Shopsy Admin Studio">
            <div className="admin-preview-topbar">
              <strong><span className="brand-mark">S</span> Shopsy</strong>
              <span>ADMIN ACCESS</span>
            </div>
            <div className="admin-preview-heading">
              <div><small>OPERATIONS / 2026</small><h3>Good morning.</h3></div>
              <i aria-hidden="true" />
            </div>
            <div className="admin-preview-stats">
              <div><small>CATALOG</small><strong>24</strong><span>live products</span></div>
              <div><small>ORDERS</small><strong>128</strong><span>all-time orders</span></div>
              <div className="admin-preview-revenue"><small>REVENUE</small><strong>₹4.8L</strong><span>paid orders</span></div>
            </div>
            <div className="admin-preview-table">
              <div><strong>Live catalog</strong><span>Products</span></div>
              <p><b>Aura Lounge Chair</b><span>In stock</span></p>
              <p><b>Linen Desk Set</b><span>In stock</span></p>
              <p><b>Teal Carryall Bag</b><span>Low stock</span></p>
            </div>
          </div>
        </section>

        <section className="promo-band">
          <div className="promo-copy">
            <p className="eyebrow ">Why Shopsy</p>
            <h2>Beautiful essentials with everyday ease.</h2>
            <p>
              Every product is thoughtfully selected to bring warmth, clarity,
              and effortless quality into your daily routine.
            </p>
          </div>

          <div className="promo-metrics">
            <div>
              <strong>15%</strong>
              <span>member savings</span>
            </div>
            <div>
              <strong>20k+</strong>
              <span>items delivered</span>
            </div>
          </div>
        </section>

        <section className="reviews-wrap">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow ">Loved by shoppers</p>
              <h2>What people are saying</h2>
            </div>
          </div>

          <div className="review-grid">
            {reviews.map((review) => (
              <article key={review.author} className="review-card">
                <div className="stars">★★★★★</div>
                <p>“{review.text}”</p>
                <strong>{review.author}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="newsletter-card">
          <div>
            <p className="eyebrow ">Stay in the loop</p>
            <h2>Get fresh drops, early access, and exclusive offers.</h2>
          </div>

          <Link to="/products" className="primary-btn newsletter-cta">
            Explore the edit <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </main>
      <StoreFooter />
    </div>
  );
}

export default HomePage;
