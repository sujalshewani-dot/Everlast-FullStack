import { Link } from "react-router-dom";
import { useProductCatalog } from "../context/ProductContext";
import "./MostSeller.css";

function MostSeller() {
const { products: catalogProducts } = useProductCatalog();
const featuredIds = [
  "men-5",
  "men-8",
  "men-1",
  "hawas-ice",
  "premium-2",
  "men-14",
  "creed-aventus",
  "men-16",
];
const products = featuredIds
  .map((routeId) => catalogProducts.find((product) => product.routeId === routeId))
  .filter(Boolean);

return ( <section className="most-seller-section"> <div className="most-seller-container"> <h2 className="talking-heading">
EVERYONE IS TALKING ABOUT </h2>

    <h3 className="most-seller-heading">
      MOST SELLER
    </h3>

    <div className="most-seller-grid">
      {products.map((product) => (
        <Link
          to={`/product/${product.routeId}`}
          className="most-seller-card"
          key={product.routeId}
        >
          <div className="most-seller-image">
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
            />

            {product.soldOut && (
              <span className="most-seller-badge">
                
                Sold out
              </span>
            )}
          </div>

          <div className="most-seller-details">
            <p className="most-seller-name">
              {product.name}
            </p>

            <div className="most-seller-reviews">
              <span className="most-seller-stars">
                ★★★★★
              </span>

              <span>
                {product.reviews} reviews
              </span>
            </div>

            <p className="most-seller-price">
              {product.priceFrom ? "From " : ""}
              Rs.{product.price.toLocaleString("en-PK")}.00 PKR
            </p>
          </div>
        </Link>
      ))}
    </div>

    <div className="view-all-container">
      <Link to="/men" className="view-all-button">
        View all
      </Link>
    </div>
  </div>
</section>


);
}

export default MostSeller;
