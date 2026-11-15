import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiRequest } from "../lib/api";

const ProductContext = createContext(null);

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshCatalog = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await apiRequest("/products");
      setProducts(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    apiRequest("/products")
      .then(({ data }) => {
        if (active) setProducts(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({ products, loading, error, refreshCatalog }),
    [products, loading, error, refreshCatalog]
  );

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProductCatalog() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProductCatalog must be used inside ProductProvider");
  }
  return context;
}
