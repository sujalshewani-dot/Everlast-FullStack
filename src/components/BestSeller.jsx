import { Link } from "react-router-dom";
import { useProductCatalog } from "../context/ProductContext";
import "./BestSeller.css";

function BestSeller() {
  const { products } = useProductCatalog();
  const product =
    products.find((item) => item.routeId === "men-5") ||
    products.find((item) => item.category === "men");
  if (!product) return null;

  return (
    <section className="top-seller-section">
      <div className="top-seller-container">

        <h2 className="top-seller-heading">
          TOP SELLER
        </h2>

        <div className="top-seller-product">

          {/* Large Product Image */}
          <Link
            to={`/product/${product.routeId}`}
            className="top-seller-main-image"
            aria-label={`View ${product.name}`}
          >
            <img
              src={product.image}
              alt={product.name}
            />
          </Link>

          {/* Product Card */}
          <Link
            to={`/product/${product.routeId}`}
            className="top-seller-info"
            aria-label={`View ${product.name}`}
          >

            <div className="top-seller-product-image">
              <img
                src={product.image}
                alt={product.name}
              />
            </div>

            {product.soldOut && <span className="sold-out">Sold out</span>}

            <p className="product-name">
              {product.name}
            </p>

            <div className="product-reviews">
              <span className="stars">★★★★★</span>
              <span className="review-count">
                {product.reviews} reviews
              </span>
            </div>

            <p className="product-price">
              From Rs.{product.price.toLocaleString("en-PK")}.00 PKR
            </p>

          </Link>

        </div>
      </div>
    </section>
  );
}

export default BestSeller;