import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";
import "./CustomerAccount.css";

const SESSION_KEY = "everlast-customer-session";
const SESSION_EXPIRY_KEY = "everlast-customer-session-expiry";

const formatPrice = (price) =>
  `PKR ${Number(price || 0).toLocaleString("en-PK")}`;

function getSavedSession() {
  try {
    const token = sessionStorage.getItem(SESSION_KEY);
    const expiresAt = Number(sessionStorage.getItem(SESSION_EXPIRY_KEY));
    if (!token || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_EXPIRY_KEY);
      return "";
    }

    return token;
  } catch {
    return "";
  }
}

function clearSavedSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_EXPIRY_KEY);
  } catch {
    return;
  }
}

export default function CustomerAccount() {
  const [token, setToken] = useState(getSavedSession);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeRequested, setCodeRequested] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(Boolean(token));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!token) return undefined;

    let active = true;
    apiRequest("/customer/orders", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ data }) => {
        if (active) setOrders(data);
      })
      .catch((requestError) => {
        if (!active) return;
        clearSavedSession();
        setToken("");
        setOrders([]);
        setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoadingOrders(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function requestCode(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);

    try {
      const { message } = await apiRequest("/customer/request-code", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setCodeRequested(true);
      setNotice(message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);

    try {
      const { data } = await apiRequest("/customer/verify-code", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      sessionStorage.setItem(SESSION_KEY, data.token);
      sessionStorage.setItem(SESSION_EXPIRY_KEY, String(data.expiresAt));
      setCode("");
      setLoadingOrders(true);
      setToken(data.token);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    clearSavedSession();
    setToken("");
    setOrders([]);
    setLoadingOrders(false);
    setEmail("");
    setCode("");
    setCodeRequested(false);
    setError("");
    setNotice("");
  }

  if (token) {
    return (
      <main className="customer-account-page">
        <section className="customer-account-panel">
          <div className="customer-account-heading">
            <div>
              <p className="customer-account-eyebrow">EVERLAST FRAGRANCES</p>
              <h1>Your orders</h1>
              <p>Order history for your verified checkout email.</p>
            </div>
            <button type="button" className="customer-signout" onClick={signOut}>
              Sign out
            </button>
          </div>

          {error && <p className="customer-account-error" role="alert">{error}</p>}
          {loadingOrders ? (
            <p className="customer-account-empty">Loading your order history...</p>
          ) : orders.length > 0 ? (
            <div className="customer-order-list">
              {orders.map((order) => (
                <article className="customer-order-card" key={order.orderNumber}>
                  <header className="customer-order-heading">
                    <div>
                      <strong>{order.orderNumber}</strong>
                      <time dateTime={order.createdAt}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </time>
                    </div>
                    <div className="customer-order-total">
                      <span>{order.status}</span>
                      <strong>{formatPrice(order.total)}</strong>
                    </div>
                  </header>
                  <ul>
                    {order.items.map((item, index) => (
                      <li key={`${order.orderNumber}-${index}`}>
                        <img src={item.image} alt="" loading="lazy" />
                        <span>
                          <strong>{item.name}</strong>
                          <small>
                            {item.selectedSize ? `${item.selectedSize} · ` : ""}
                            Quantity: {item.quantity}
                          </small>
                        </span>
                        <b>{formatPrice(item.price * item.quantity)}</b>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : (
            <p className="customer-account-empty">No previous orders were found.</p>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="customer-account-page">
      <section className="customer-account-panel customer-signin-panel">
        <p className="customer-account-eyebrow">EVERLAST FRAGRANCES</p>
        <h1>Order history</h1>
        <p>
          Sign in with the email used at checkout. We’ll send a one-time code
          to verify it’s yours.
        </p>

        {error && <p className="customer-account-error" role="alert">{error}</p>}
        {notice && <p className="customer-account-notice" role="status">{notice}</p>}

        {!codeRequested ? (
          <form onSubmit={requestCode}>
            <label>
              Checkout email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? "Sending code..." : "Send sign-in code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode}>
            <label>
              Six-digit email code
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
              />
            </label>
            <button type="submit" disabled={busy || code.length !== 6}>
              {busy ? "Verifying..." : "View my orders"}
            </button>
            <button
              type="button"
              className="customer-change-email"
              onClick={() => {
                setCodeRequested(false);
                setCode("");
                setNotice("");
                setError("");
              }}
            >
              Use a different email
            </button>
          </form>
        )}

        <Link className="customer-back-to-store" to="/men">
          Continue shopping
        </Link>
      </section>
    </main>
  );
}
