import { Product } from "@/app/models/Product";
import { useState, useCallback } from "react";

export const usePayOrder = (
  authToken: string,
  orderId: string,
  setOrderId: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payOrder = useCallback(
    (
      basket: Product[],
      setBasket: React.Dispatch<React.SetStateAction<Product[]>>
    ) => {
      if (!orderId) return;
      setIsLoading(true);
      fetch("https://kanpla-code-challenge.up.railway.app/payments", {
        method: "POST",
        headers: {
          "x-auth-user": authToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: orderId,
          amount: basket.reduce((acc, item) => acc + item.price_unit, 0),
        }),
      })
        .then((response) =>
          response.status === 201 ? response.json() : Promise.reject(response)
        )
        .then((json) => {
          fetch(
            `https://kanpla-code-challenge.up.railway.app/orders/${json.order_id}`,
            {
              method: "PATCH",
              headers: {
                "x-auth-user": authToken,
              },
              body: JSON.stringify({
                status: "completed",
              }),
            }
          )
            .then((response) =>
              response.status === 201
                ? response.json()
                : Promise.reject(response)
            )
            .then(() => {
              setBasket([]);
              setOrderId(null);
              setIsLoading(false);
            })
            .catch((error) => {
              setError(
                error.message || "Failed to complete payment. Please try again."
              );
              setIsLoading(false);
            });
        })
        .catch((error) => {
          setError(
            error.message || "Failed to process payment. Please try again."
          );
          setIsLoading(false);
        });
    },
    [authToken]
  );

  return { payOrder, isLoading, error };
};
