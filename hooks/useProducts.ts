import { useState, useEffect } from "react";

const useProducts = (authToken: string) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          "https://kanpla-code-challenge.up.railway.app/products",
          {
            headers: {
              "x-auth-user": authToken,
            },
          }
        );
        const json = await response.json();
        setProducts(json);
      } catch (error) {
        setError(error.message || "Failed to load products. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [authToken]);

  return { products, isLoading, error };
};

export default useProducts;
