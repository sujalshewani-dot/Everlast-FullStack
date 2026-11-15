import { useState } from "react";
import { apiRequest } from "../lib/api";
import "./Contact.css";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    comment: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const { message } = await apiRequest("/contact", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      setSuccess(message);
      setFormData({ name: "", email: "", phone: "", comment: "" });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="contact-container">
      <h1 className="contact-title">Contact</h1>

      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="input-group">
            <input
              type="text"
              name="name"
              placeholder="Name"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email *"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row full-width">
          <div className="input-group">
            <input
              type="tel"
              name="phone"
              placeholder="Phone number"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row full-width">
          <div className="input-group">
            <textarea
              name="comment"
              placeholder="Comment"
              rows={6}
              value={formData.comment}
              onChange={handleChange}
            />
          </div>
        </div>

        {error && (
          <p className="contact-form-message contact-form-error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="contact-form-message" role="status">
            {success}
          </p>
        )}

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? "Sending..." : "Send"}
        </button>
      </form>
    </main>
  );
}