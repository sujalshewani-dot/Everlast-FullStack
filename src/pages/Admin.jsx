import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import { useProductCatalog } from "../context/ProductContext";
import "./Admin.css";

const emptyProduct = {
  name: "",
  category: "men",
  image: "",
  price: "",
  stock55: 0,
  stock110: 0,
  reviews: 0,
  bottleLabel: "",
  priceFrom: false,
  isActive: true,
  sortOrder: 0,
};

const orderStatusTransitions = {
  "Awaiting payment confirmation": ["Payment confirmed", "Cancelled"],
  "Payment confirmed": ["Processing", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

const contactStatuses = ["new", "read", "resolved"];

const formatPrice = (price) =>
  `PKR ${Number(price || 0).toLocaleString("en-PK")}`;

function getAdminToken() {
  try {
    return sessionStorage.getItem("everlast-admin-session") || "";
  } catch {
    return "";
  }
}

function clearAdminToken() {
  try {
    sessionStorage.removeItem("everlast-admin-session");
  } catch {
    // The session ends with the current page if browser storage is unavailable.
  }
}

async function adminRequest(path, options = {}) {
  const token = getAdminToken();
  return apiRequest(path, {
    ...options,
    headers: {
      "X-Everlast-Admin": "1",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

export default function Admin() {
  const { refreshCatalog } = useProductCatalog();
  const [admin, setAdmin] = useState(null);
  const [checkingSession, setCheckingSession] = useState(
    () => Boolean(getAdminToken())
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const reportLoadError = useCallback(
    (requestError) => setError(requestError.message),
    []
  );

  const loadProducts = useCallback(async () => {
    const { data } = await adminRequest("/admin/products");
    setProducts(data);
  }, []);

  const loadOrders = useCallback(async () => {
    const { data } = await adminRequest("/admin/orders");
    setOrders(data);
  }, []);

  const loadContacts = useCallback(async () => {
    const { data } = await adminRequest("/admin/contacts");
    setContacts(data);
  }, []);

  useEffect(() => {
    if (!getAdminToken()) return;

    adminRequest("/admin/session")
      .then(({ data }) => setAdmin(data))
      .catch((requestError) => {
        clearAdminToken();
        if (requestError.message !== "Please sign in as an administrator.") {
          setError(requestError.message);
        }
      })
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    if (!admin) return;
    if (activeTab === "products") {
      Promise.all([loadProducts(), loadContacts()]).catch(reportLoadError);
      return;
    }

    const load =
      activeTab === "orders" ? loadOrders : loadContacts;
    load().catch(reportLoadError);
  }, [admin, activeTab, loadProducts, loadOrders, loadContacts, reportLoadError]);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const { data } = await adminRequest("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      sessionStorage.setItem("everlast-admin-session", data.token);
      setAdmin({ email: data.email });
      setPassword("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    try {
      await adminRequest("/admin/logout", { method: "POST", body: "{}" });
      clearAdminToken();
      setAdmin(null);
      setProducts([]);
      setOrders([]);
      setContacts([]);
    } catch (requestError) {
      clearAdminToken();
      setAdmin(null);
      setError(requestError.message);
    }
  }

  function startCreate() {
    setError("");
    setNotice("");
    setForm({ ...emptyProduct });
  }

  function startEdit(product) {
    setError("");
    setNotice("");
    setForm({
      name: product.name,
      category: product.category,
      image: product.image,
      price: product.price,
      stock55: product.stock55,
      stock110: product.stock110,
      reviews: product.reviews,
      bottleLabel: product.bottleLabel || "",
      priceFrom: Boolean(product.priceFrom),
      isActive: product.isActive,
      sortOrder: product.sortOrder,
      routeId: product.routeId,
    });
  }

  function handleFormChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  }

  async function saveProduct(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    const { routeId, ...productData } = form;
    try {
      await adminRequest(
        routeId
          ? `/admin/products/${encodeURIComponent(routeId)}`
          : "/admin/products",
        {
          method: routeId ? "PATCH" : "POST",
          body: JSON.stringify(productData),
        }
      );
      await Promise.all([loadProducts(), refreshCatalog()]);
      setForm(null);
      setNotice(routeId ? "Product updated." : "Product added.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function archiveProduct(product) {
    const action = product.isActive ? "remove" : "restore";
    if (product.isActive && !window.confirm(`Remove ${product.name} from the storefront?`)) {
      return;
    }

    setError("");
    setNotice("");
    try {
      if (product.isActive) {
        await adminRequest(`/admin/products/${encodeURIComponent(product.routeId)}`, {
          method: "DELETE",
        });
      } else {
        await adminRequest(`/admin/products/${encodeURIComponent(product.routeId)}`, {
          method: "PATCH",
          body: JSON.stringify({ isActive: true }),
        });
      }
      await Promise.all([loadProducts(), refreshCatalog()]);
      setNotice(`Product ${action === "remove" ? "archived" : "restored"}.`);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function changeOrderStatus(orderNumber, status) {
    setError("");
    try {
      await adminRequest(
        `/admin/orders/${encodeURIComponent(orderNumber)}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );
      await Promise.all([loadOrders(), refreshCatalog()]);
      setNotice(`Order ${orderNumber} updated.`);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function changeContactStatus(id, status) {
    setError("");
    try {
      await adminRequest(`/admin/contacts/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadContacts();
      setNotice("Contact message updated.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  if (checkingSession) {
    return <main className="admin-page"><p>Loading admin...</p></main>;
  }

  if (!admin) {
    return (
      <main className="admin-page admin-login-page">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <p className="admin-eyebrow">EVERLAST FRAGRANCES</p>
          <h1>Administrator sign in</h1>
          <p>Access is limited to the configured store administrator.</p>
          {error && <p className="admin-error" role="alert">{error}</p>}
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">EVERLAST FRAGRANCES</p>
          <h1>Store admin</h1>
          <span>{admin.email}</span>
        </div>
        <button type="button" className="admin-logout" onClick={handleLogout}>
          Sign out
        </button>
      </header>

      <nav className="admin-tabs" aria-label="Admin sections">
        <button
          type="button"
          className={activeTab === "products" ? "active" : ""}
          onClick={() => setActiveTab("products")}
        >
          Products ({products.length})
        </button>
        <button
          type="button"
          className={activeTab === "orders" ? "active" : ""}
          onClick={() => setActiveTab("orders")}
        >
          Orders
        </button>
        <button
          type="button"
          className={activeTab === "contacts" ? "active" : ""}
          onClick={() => setActiveTab("contacts")}
        >
          Contacts ({contacts.filter((contact) => contact.status === "new").length})
        </button>
      </nav>

      {error && <p className="admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-notice" role="status">{notice}</p>}

      {activeTab === "products" && (
        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <h2>Product catalog</h2>
              <p>Update storefront content, PKR pricing, and size-specific stock.</p>
            </div>
            <button type="button" onClick={startCreate}>Add product</button>
          </div>

          {form && (
            <form className="admin-product-form" onSubmit={saveProduct}>
              <h3>{form.routeId ? `Edit ${form.name}` : "New product"}</h3>
              <div className="admin-form-grid">
                <label>
                  Product name
                  <input name="name" value={form.name} onChange={handleFormChange} required maxLength={200} />
                </label>
                <label>
                  Collection
                  <select name="category" value={form.category} onChange={handleFormChange}>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="new">New arrivals</option>
                    <option value="premium">Premium</option>
                    <option value="home">Home / featured</option>
                  </select>
                </label>
                <label className="admin-form-wide">
                  Image path or HTTPS URL
                  <input name="image" value={form.image} onChange={handleFormChange} placeholder="/images/products/example.png" required />
                </label>
                <label>
                  55 ML price (PKR)
                  <input name="price" type="number" min="1" step="1" value={form.price} onChange={handleFormChange} required />
                </label>
                <label>
                  110 ML price (PKR)
                  <input type="number" value={Number(form.price || 0) * 2} readOnly />
                </label>
                <label>
                  55 ML stock
                  <input name="stock55" type="number" min="0" step="1" value={form.stock55} onChange={handleFormChange} required />
                </label>
                <label>
                  110 ML stock
                  <input name="stock110" type="number" min="0" step="1" value={form.stock110} onChange={handleFormChange} required />
                </label>
                <label>
                  Review count
                  <input name="reviews" type="number" min="0" step="1" value={form.reviews} onChange={handleFormChange} />
                </label>
                <label>
                  Sort order
                  <input name="sortOrder" type="number" min="0" step="1" value={form.sortOrder} onChange={handleFormChange} />
                </label>
                <label className="admin-form-wide">
                  Premium bottle label (optional)
                  <input name="bottleLabel" value={form.bottleLabel} onChange={handleFormChange} maxLength={160} />
                </label>
                <label className="admin-checkbox">
                  <input name="priceFrom" type="checkbox" checked={form.priceFrom} onChange={handleFormChange} />
                  Show “From” before the product price
                </label>
                {form.routeId && (
                  <label className="admin-checkbox">
                    <input name="isActive" type="checkbox" checked={form.isActive} onChange={handleFormChange} />
                    Visible in the storefront
                  </label>
                )}
              </div>
              <div className="admin-form-actions">
                <button type="submit" disabled={busy}>{busy ? "Saving..." : "Save product"}</button>
                <button type="button" className="secondary" onClick={() => setForm(null)}>Cancel</button>
              </div>
            </form>
          )}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th><th>Collection</th><th>55 / 110 ML</th>
                  <th>Stock (55 / 110)</th><th>Visibility</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.routeId}>
                    <td>
                      <div className="admin-product-cell">
                        <img src={product.image} alt="" />
                        <span>{product.name}<small>{product.routeId}</small></span>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td>{formatPrice(product.price)}<small>{formatPrice(product.price110)}</small></td>
                    <td>{product.stock55} / {product.stock110}</td>
                    <td>{product.isActive ? "Live" : "Archived"}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button type="button" onClick={() => startEdit(product)}>Edit</button>
                        <button type="button" className="secondary" onClick={() => archiveProduct(product)}>
                          {product.isActive ? "Archive" : "Restore"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan="6">No products in the catalog.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "orders" && (
        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <h2>Orders</h2>
              <p>Confirm payments, track fulfillment, or cancel and restock orders.</p>
            </div>
            <button type="button" className="secondary" onClick={() => loadOrders().catch((e) => setError(e.message))}>
              Refresh
            </button>
          </div>
          <div className="admin-order-list">
            {orders.map((order) => (
              <article className="admin-order-card" key={order.orderNumber}>
                <div className="admin-order-heading">
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <span>{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                  <strong>{formatPrice(order.total)}</strong>
                </div>
                <div className="admin-order-customer">
                  <strong>{order.customer.fullName}</strong>
                  <span>{order.customer.email} · {order.customer.phone}</span>
                  <span>{order.customer.address}, {order.customer.city}</span>
                </div>
                <ul>
                  {order.items.map((item) => (
                    <li key={item.cartKey}>
                      {item.name} · {item.selectedSize} × {item.quantity}
                    </li>
                  ))}
                </ul>
                <label className="admin-order-status">
                  Status
                  <select
                    value={order.status}
                    disabled={order.status === "Delivered" || order.status === "Cancelled"}
                    onChange={(event) => changeOrderStatus(order.orderNumber, event.target.value)}
                  >
                    {[
                      order.status,
                      ...(orderStatusTransitions[order.status] || []),
                    ].map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
              </article>
            ))}
            {orders.length === 0 && <p>No orders yet.</p>}
          </div>
        </section>
      )}

      {activeTab === "contacts" && (
        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <h2>Customer messages</h2>
              <p>Messages submitted through the storefront contact form.</p>
            </div>
            <button
              type="button"
              className="secondary"
              onClick={() => loadContacts().catch((e) => setError(e.message))}
            >
              Refresh
            </button>
          </div>
          <div className="admin-contact-list">
            {contacts.map((contact) => (
              <article className="admin-contact-card" key={contact._id}>
                <div className="admin-order-heading">
                  <div>
                    <strong>{contact.name || "Customer"}</strong>
                    <span>{new Date(contact.createdAt).toLocaleString()}</span>
                  </div>
                  <a href={`mailto:${encodeURIComponent(contact.email)}`}>
                    {contact.email}
                  </a>
                </div>
                {contact.phone && <p>Phone: {contact.phone}</p>}
                <p className="admin-contact-message">{contact.comment || "No message provided."}</p>
                <label className="admin-order-status">
                  Status
                  <select
                    value={contact.status}
                    onChange={(event) =>
                      changeContactStatus(contact._id, event.target.value)
                    }
                  >
                    {contactStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status[0].toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
              </article>
            ))}
            {contacts.length === 0 && <p>No customer messages yet.</p>}
          </div>
        </section>
      )}
    </main>
  );
}
