import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useProductCatalog } from "../context/ProductContext";
import "./NewArrivals.css";

const ITEMS_PER_PAGE = 16;

function formatPrice(price) {
  return `Rs. ${price.toLocaleString("en-PK")}.00 PKR`;
}

export default function NewArrivals() {
  const {
    products: catalogProducts,
    loading: catalogLoading,
    error: catalogError,
  } = useProductCatalog();
  const products = catalogProducts.filter((product) => product.category === "new");
  const [searchParams] = useSearchParams();
  const searchQuery = (searchParams.get("search") || "").trim().toLowerCase();

  const [availability, setAvailability] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [page, setPage] = useState(1);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      result = result.filter((product) =>
        product.name.toLowerCase().includes(searchQuery)
      );
    }

    if (availability === "available") {
      result = result.filter((product) => !product.soldOut);
    } else if (availability === "soldout") {
      result = result.filter((product) => product.soldOut);
    }

    if (sortBy === "low-high") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "high-low") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [availability, sortBy, searchQuery, products]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  function changeAvailability(value) {
    setAvailability(value);
    setPage(1);
  }

  function changeSort(value) {
    setSortBy(value);
    setPage(1);
  }

  return (
    <main className="new-arrivals-collection">
      <h1 className="new-arrivals-title">
        {searchQuery
          ? `Search results for "${searchParams.get("search")}"`
          : "NEW ARRIVALS"}
      </h1>
      {catalogLoading && <p role="status">Loading products...</p>}
      {catalogError && <p role="alert">{catalogError}</p>}

      {searchQuery && (
        <p className="new-arrivals-search-summary">
          {filteredProducts.length} matching product
          {filteredProducts.length === 1 ? "" : "s"}
        </p>
      )}

      <div className="new-arrivals-toolbar">
        <div className="new-arrivals-filters">
          <label>
            Filter:
            <select
              value={availability}
              onChange={(event) => changeAvailability(event.target.value)}
            >
              <option value="all">Availability</option>
              <option value="available">In stock</option>
              <option value="soldout">Sold out</option>
            </select>
          </label>

          <label>
            Price:
            <select
              value={sortBy}
              onChange={(event) => changeSort(event.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="low-high">Price, low to high</option>
              <option value="high-low">Price, high to low</option>
              <option value="name">Alphabetically</option>
            </select>
          </label>
        </div>

        <div className="new-arrivals-sort-summary">
          <label>
            Sort by:
            <select
              value={sortBy}
              onChange={(event) => changeSort(event.target.value)}
            >
              <option value="featured">Best selling</option>
              <option value="low-high">Price, low to high</option>
              <option value="high-low">Price, high to low</option>
              <option value="name">Alphabetically</option>
            </select>
          </label>

          <span>{filteredProducts.length} products</span>
        </div>
      </div>

      <div className="new-arrivals-product-grid">
        {visibleProducts.map((product) => (
          <Link
            className="new-arrivals-product-card"
            key={product.routeId}
            to={`/product/${product.routeId}`}
            aria-label={`View ${product.name}`}
          >
            <div className="new-arrivals-product-image">
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
              />

              {product.soldOut && (
                <span className="new-arrivals-sold-out">Sold out</span>
              )}
            </div>

            <div className="new-arrivals-product-details">
              <h2>{product.name}</h2>

              <div className="new-arrivals-product-reviews">
                <span className="new-arrivals-stars" aria-label="5 stars">
                  ★★★★★
                </span>

                <span>
                  {product.reviews > 0
                    ? `${product.reviews} reviews`
                    : "No reviews"}
                </span>
              </div>

              <p className="new-arrivals-product-price">
                {formatPrice(product.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <p className="new-arrivals-no-products">No products found.</p>
      )}

      {totalPages > 1 && (
        <nav
          className="new-arrivals-pagination"
          aria-label="New arrivals pages"
        >
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            ‹
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                className={
                  currentPage === pageNumber ? "current-page" : ""
                }
                onClick={() => setPage(pageNumber)}
                aria-current={
                  currentPage === pageNumber ? "page" : undefined
                }
              >
                {pageNumber}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            ›
          </button>
        </nav>
      )}
    </main>
  );
}