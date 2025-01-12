import { Product } from "@/app/models/Product";
import { useState } from "react";

export const useCreateOrder = (authToken: string) => {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = (basket: Product[]) => {
    setIsLoading(true);
    fetch("https://kanpla-code-challenge.up.railway.app/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-user": authToken,
      },
      body: JSON.stringify({
        total: basket.reduce((acc, item) => acc + item.price_unit, 0),
      }),
    })
      .then((response) => response.json())
      .then((json) => {
        setOrderId(json.id);
        setIsLoading(false);
      })
      .catch((error) => {
        setError(error.message || "Failed to create order. Please try again.");
        setIsLoading(false);
      });
  };

  return { orderId, createOrder, isLoading, error };
};
