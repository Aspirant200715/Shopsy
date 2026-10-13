import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import useAuth from "../context/useAuth";
import formatPrice from "../utils/formatPrice";
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminOrders,
  getAdminOverview,
  getAdminProducts,
  updateAdminOrderStatus,
  updateAdminProduct,
} from "../services/adminApi";

const emptyProduct = { name: "", description: "", price: "", category: "", image: "", stock: "" };
const nextStatus = { PLACED: "CONFIRMED", CONFIRMED: "SHIPPED", SHIPPED: "DELIVERED" };

function AdminPage() {
  const { customer } = useAuth();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([getAdminOverview(controller.signal), getAdminProducts(controller.signal), getAdminOrders(controller.signal)])
      .then(([overview, productData, orderData]) => {
        setStats(overview.stats);
        setProducts(productData.products || []);
        setOrders(orderData.orders || []);
      })
      .catch((requestError) => {
        if (requestError.name !== "CanceledError" && requestError.code !== "ERR_CANCELED") {
          setError(requestError.response?.data?.message || "Unable to load admin dashboard.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const lowStock = useMemo(() => products.filter((product) => product.stock <= 5).length, [products]);
  const changeForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submitProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
      const response = editingId ? await updateAdminProduct(editingId, payload) : await createAdminProduct(payload);
      setProducts((current) => editingId ? current.map((item) => item._id === editingId ? response.product : item) : [response.product, ...current]);
      setForm(emptyProduct);
      setEditingId("");
      toast.success(editingId ? "Product updated." : "Product added.");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to save product.");
    } finally {
      setSaving(false);
    }
  };

  const editProduct = (product) => {
    setEditingId(product._id);
    setForm({ name: product.name, description: product.description, price: product.price, category: product.category, image: product.image, stock: product.stock });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeProduct = async (id) => {
    if (!window.confirm("Remove this product from the catalog?")) return;
    try {
      await deleteAdminProduct(id);
      setProducts((current) => current.filter((item) => item._id !== id));
      toast.success("Product removed.");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to remove product.");
    }
  };

  const advanceOrder = async (order) => {
    const status = nextStatus[order.orderStatus];
    if (!status) return;
    try {
      const response = await updateAdminOrderStatus(order._id, status);
      setOrders((current) => current.map((item) => item._id === order._id ? response.order : item));
      toast.success(`Order moved to ${status.toLowerCase()}.`);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to update order.");
    }
  };

  return (
    <div className="home-shell admin-shell">
      <header className="topbar">
        <Link to="/" className="brand brand-dark"><span className="brand-mark">S</span>Shopsy</Link>
        <nav className="nav-links"><Link to="/">Storefront</Link><Link className="active-nav" to="/admin">Admin studio</Link><Link to="/logout">Logout</Link></nav>
        <div className="nav-actions">
          <Link className="profile-nav-link" to="/profile" title="Open your profile">
            {customer?.fullname || "Profile"}
          </Link>
        </div>
      </header>
      <main className="admin-page">
        <section className="admin-heading">
        <div>
          <Link to="/" className="admin-brand" aria-label="Shopsy storefront">
            <span className="brand-mark">S</span>
            <span>Shopsy</span>
          </Link>
          <p className="eyebrow">Operations / {new Date().getFullYear()}</p>
          <h1>Good morning, {customer?.fullname?.split(" ")[0]}.</h1>
          <p>Keep the catalog sharp and every order moving.</p>
        </div>
        <span className="admin-badge">ADMIN ACCESS</span>
      </section>
        {loading && <div className="state-panel"><span className="loader-dot" />Loading your studio...</div>}
        {!loading && error && <div className="state-panel state-error"><strong>Dashboard unavailable.</strong><span>{error}</span></div>}
        {!loading && !error && <>
          <section className="admin-stat-grid">
            <div className="admin-stat"><span>Catalog</span><strong>{stats?.products || 0}</strong><small>live products</small></div>
            <div className="admin-stat"><span>Customers</span><strong>{stats?.customers || 0}</strong><small>registered accounts</small></div>
            <div className="admin-stat"><span>Orders</span><strong>{stats?.orders || 0}</strong><small>all-time orders</small></div>
            <div className="admin-stat admin-stat-accent"><span>Revenue</span><strong>{formatPrice(stats?.revenue || 0)}</strong><small>paid orders</small></div>
          </section>
          <section className="admin-layout">
            <form className="admin-card admin-product-form" onSubmit={submitProduct}>
              <div className="admin-card-heading"><div><p className="eyebrow">Catalog desk</p><h2>{editingId ? "Edit product" : "Add product"}</h2></div>{lowStock > 0 && <span className="stock-alert">{lowStock} low stock</span>}</div>
              <label className="admin-field"><span>Name</span><input name="name" value={form.name} onChange={changeForm} required /></label>
              <label className="admin-field"><span>Description</span><textarea name="description" value={form.description} onChange={changeForm} rows="3" required /></label>
              <div className="admin-form-row"><label className="admin-field"><span>Price</span><input name="price" type="number" min="0.01" step="0.01" value={form.price} onChange={changeForm} required /></label><label className="admin-field"><span>Stock</span><input name="stock" type="number" min="0" value={form.stock} onChange={changeForm} required /></label></div>
              <div className="admin-form-row"><label className="admin-field"><span>Category</span><input name="category" value={form.category} onChange={changeForm} required /></label><label className="admin-field"><span>Image URL</span><input name="image" type="url" value={form.image} onChange={changeForm} required /></label></div>
              <div className="admin-form-actions"><button className="primary-btn" disabled={saving}>{saving ? "Saving..." : editingId ? "Save changes" : "Add product"}</button>{editingId && <button type="button" className="ghost-btn" onClick={() => { setEditingId(""); setForm(emptyProduct); }}>Cancel</button>}</div>
            </form>
            <section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">Live catalog</p><h2>Products</h2></div><span className="admin-muted">{products.length} total</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th /></tr></thead><tbody>{products.map((product) => <tr key={product._id}><td><strong>{product.name}</strong><small>{product.category}</small></td><td>{formatPrice(product.price)}</td><td><span className={product.stock <= 5 ? "stock-low" : "stock-ok"}>{product.stock}</span></td><td className="admin-actions"><button type="button" onClick={() => editProduct(product)}>Edit</button><button type="button" onClick={() => removeProduct(product._id)}>Remove</button></td></tr>)}</tbody></table></div></section>
          </section>
          <section className="admin-card admin-orders-card"><div className="admin-card-heading"><div><p className="eyebrow">Fulfilment desk</p><h2>Recent orders</h2></div><span className="admin-muted">{orders.length} total</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Action</th></tr></thead><tbody>{orders.map((order) => <tr key={order._id}><td><strong>#{order._id.slice(-8).toUpperCase()}</strong><small>{new Date(order.createdAt).toLocaleDateString()}</small></td><td>{order.user?.fullname || "Customer"}<small>{order.user?.email}</small></td><td>{formatPrice(order.totalAmount)}</td><td><span className="order-status">{order.orderStatus}</span></td><td>{nextStatus[order.orderStatus] ? <button type="button" className="status-action" onClick={() => advanceOrder(order)}>Mark {nextStatus[order.orderStatus].toLowerCase()}</button> : <span className="admin-muted">Complete</span>}</td></tr>)}</tbody></table></div></section>
        </>}
      </main>
    </div>
  );
}

export default AdminPage;
