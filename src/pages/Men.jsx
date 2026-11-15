import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useProductCatalog } from "../context/ProductContext";

import "./Men.css";

const ITEMS_PER_PAGE = 16;

function formatPrice(price) {
  return `Rs. ${price.toLocaleString("en-PK")}.00 PKR`;
}

export default function Men() {
  const {
    products: catalogProducts,
    loading: catalogLoading,
    error: catalogError,
  } = useProductCatalog();
  const products = catalogProducts.filter((product) => product.category === "men");
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

    if (sortBy === "low-high") result.sort((a, b) => a.price - b.price);
    if (sortBy === "high-low") result.sort((a, b) => b.price - a.price);
    if (sortBy === "name") result.sort((a, b) => a.name.localeCompare(b.name));

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

  return (
    <main className="men-collection">
      <h1 className="men-title">
        {searchQuery
          ? `Search results for "${searchParams.get("search")}"`
          : "Men's Perfumes"}
      </h1>
      {catalogLoading && <p role="status">Loading products...</p>}
      {catalogError && <p role="alert">{catalogError}</p>}

      {searchQuery && (
        <p className="men-search-summary">
          {filteredProducts.length} matching product
          {filteredProducts.length === 1 ? "" : "s"}
        </p>
      )}

      <div className="men-toolbar">
        <div className="men-filters">
          <label>
            Filter:
            <select
              value={availability}
              onChange={(event) => {
                setAvailability(event.target.value);
                setPage(1);
              }}
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
              onChange={(event) => {
                setSortBy(event.target.value);
                setPage(1);
              }}
            >
              <option value="featured">Featured</option>
              <option value="low-high">Price, low to high</option>
              <option value="high-low">Price, high to low</option>
              <option value="name">Alphabetically</option>
            </select>
          </label>
        </div>

        <div className="men-sort-summary">
          <label>
            Sort by:
            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value);
                setPage(1);
              }}
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

      <div className="men-product-grid">
        {visibleProducts.map((product) => (
          <Link
            className="men-product-card"
            key={product.routeId}
            to={`/product/${product.routeId}`}
            aria-label={`View ${product.name}`}
          >
            <div className="men-product-image">
              <img src={product.image} alt={product.name} loading="lazy" />
              {product.soldOut && (
                <span className="men-sold-out">Sold out</span>
              )}
            </div>

            <div className="men-product-details">
              <h2>{product.name}</h2>
              <div className="men-product-reviews">
                <span className="men-stars" aria-label="5 stars">
                  ★★★★★
                </span>
                <span>
                  {product.reviews > 0
                    ? `${product.reviews} reviews`
                    : "No reviews"}
                </span>
              </div>
              <p className="men-product-price">
                {formatPrice(product.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <p className="men-no-products">No products found.</p>
      )}

      {totalPages > 1 && (
        <nav className="men-pagination" aria-label="Product pages">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={currentPage === 1}
          >
            ‹
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                className={currentPage === pageNumber ? "current-page" : ""}
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
          >
            ›
          </button>
        </nav>
      )}
    </main>
  );
}