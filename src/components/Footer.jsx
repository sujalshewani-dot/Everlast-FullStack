import { Link } from "react-router-dom";
import { useState } from "react";
import { apiRequest } from "../lib/api";
import "./Footer.css";

function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [newsletterError, setNewsletterError] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  async function handleNewsletterSubmit(event) {
    event.preventDefault();
    setNewsletterMessage("");
    setSubscribing(true);

    try {
      const { message } = await apiRequest("/newsletter", {
        method: "POST",
        body: JSON.stringify({ email: newsletterEmail }),
      });
      setNewsletterMessage(message);
      setNewsletterError(false);
      setNewsletterEmail("");
    } catch (error) {
      setNewsletterMessage(error.message);
      setNewsletterError(true);
    } finally {
      setSubscribing(false);
    }
  }

  return (
<> <footer className="everlast-footer"> <div className="footer-description"> <p className="footer-brand-text"> <strong>At Everlast Fragrances,</strong> we believe every
moment deserves a signature scent. Discover fragrances
crafted to inspire confidence, express individuality,
and leave a lasting impression. </p>

      <p className="footer-support-text">
        <strong>For any queries or support,</strong> please feel
        free to get in touch with us. We're always happy to help.
      </p>

      <p className="footer-contact">
        Email:{" "}
        <a href="mailto:everlastfragrances@gmail.com">
          everlastfragrances@gmail.com
        </a>
      </p>

      <p className="footer-contact">
        Contact us at whatsapp no:{" "}
        <a
          href="https://wa.me/923283383607"
          target="_blank"
          rel="noreferrer"
        >
          03283383607
        </a>
      </p>

      <div className="footer-newsletter">
        <h3>Sign Up To Receive Exclusive Offers</h3>

        <form className="footer-email-form" onSubmit={handleNewsletterSubmit}>
          <input
            type="email"
            placeholder="Email"
            aria-label="Email address"
            required
            value={newsletterEmail}
            onChange={(event) => setNewsletterEmail(event.target.value)}
            disabled={subscribing}
          />

          <button type="submit" aria-label="Subscribe" disabled={subscribing}>
            {subscribing ? "…" : "→"}
          </button>
        </form>
        {newsletterMessage && (
          <p role={newsletterError ? "alert" : "status"}>{newsletterMessage}</p>
        )}
      </div>
    </div>

    <nav className="footer-links" aria-label="Footer links">
      <Link to="/privacy-policy">Privacy Policy</Link>
      <Link to="/about">About us</Link>
      <Link to="/why-everlast">Why Everlast Fragrances?</Link>
      <Link to="/shipping">Shipping Policy</Link>
      <Link to="/terms">Terms of Service</Link>
      <Link to="/refund-policy">Refund Policy</Link>
      <Link to="/community">Join Everlast Community</Link>
      <Link to="/admin">Admin</Link>
    </nav>



    <div className="footer-social footer-social-bottom">
      <a
        href="https://www.facebook.com/"
        target="_blank"
        rel="noreferrer"
        aria-label="Facebook"
      >
        <span className="facebook-icon">f</span>
      </a>

      <a
        href="https://www.instagram.com/"
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram"
        className="instagram-icon"
      >
        ◎
      </a>
    </div>
  </footer>

  <a
    className="whatsapp-chat"
    href="https://wa.me/923283383607"
    target="_blank"
    rel="noreferrer"
  >
    <span className="whatsapp-symbol">◉</span>
    <span>Chat with us</span>
  </a>
    </>

  );
}

export default Footer;
