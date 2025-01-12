import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Snackbar } from "react-native-paper";
import NetInfo from "@react-native-community/netinfo";

type Product = {
  id: string;
  name: string;
  price_unit: number;
  vat_rate: number;
};

const AUTH_USER_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJleHBpcmVzSW4iOiIxMGQiLCJzdWIiOiJ2aWN0b3J5YS5jb3ptYUBnbWFpbC5jb20ifQ.4TbzcbPw1TalmrO4nXsAn98r127iMOL6xGcFBs83pEg"; // use your own token

export default function PosScreen() {
  const [basket, setBasket] = useState<Product[]>([]);
  const [products, setProducts] = useState([] as Product[]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSnackVisible, setSnackVisible] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected || false);
    });

    return () => unsubscribe();
  }, []);

  // Load data from AsyncStorage on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedProducts = await AsyncStorage.getItem("products");

        if (storedProducts) {
          setProducts(JSON.parse(storedProducts));
        }

        // Fetch products if not found in storage
        if (!storedProducts) {
          fetchProducts();
        } else {
          setIsLoadingProducts(false);
        }
      } catch (e) {
        console.error("Failed to load from AsyncStorage:", e);
        setIsLoadingProducts(false);
      }
    };

    loadData();
  }, []);

  // Fetch products from the API and save to AsyncStorage
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    fetch("https://kanpla-code-challenge.up.railway.app/products", {
      headers: {
        "x-auth-user": AUTH_USER_TOKEN,
      },
    })
      .then((response) => response.json())
      .then(async (json) => {
        setProducts(json);
        await AsyncStorage.setItem("products", JSON.stringify(json)); // Save to AsyncStorage
        setIsLoadingProducts(false);
      })
      .catch((error) => {
        setError(error.message || "Failed to load products. Please try again.");
        setSnackVisible(true);
        setIsLoadingProducts(false);
      });
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.product}
      onPress={() => setBasket((prev) => [...prev, item])}
    >
      <Text style={styles.text}>{item.name}</Text>
      <Text style={styles.text}>
        ${(item.price_unit * (item.vat_rate + 1)).toFixed(2)}
      </Text>
    </TouchableOpacity>
  );

  //Not sure why this is returning 422
  const createOrder = () => {
    setIsLoadingOrder(true);
    // Optimistic update: immediately set the order ID to a temporary value
    const optimisticOrderId = "temp-order-id"; // Use a temporary order ID
    setOrderId(optimisticOrderId);

    const order = {
      total: basket
        .reduce((acc, item) => acc + item.price_unit * (1 + item.vat_rate), 0)
        .toFixed(2),
      basket,
    };

    // Save order locally if offline
    AsyncStorage.setItem("pendingOrder", JSON.stringify(order))
      .then(() => {
        // Try to sync later when online
        setIsLoadingOrder(false);
        if (isOnline) {
          syncPendingOrders();
        }
      })
      .catch((error) => {
        setError(error.message || "Failed to create order offline.");
        setSnackVisible(true);
        setIsLoadingOrder(false);
      });
  };

  const syncPendingOrders = () => {
    AsyncStorage.getItem("pendingOrder")
      .then((pendingOrderStr) => {
        if (pendingOrderStr) {
          const order = JSON.parse(pendingOrderStr);
          fetch("https://kanpla-code-challenge.up.railway.app/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-auth-user": AUTH_USER_TOKEN,
            },
            body: JSON.stringify({
              total: order.total,
              basket: order.basket,
            }),
          })
            .then((response) => response.json())
            .then((json) => {
              setOrderId(json.id);
              AsyncStorage.removeItem("pendingOrder"); // Clear pending order
              setIsLoadingOrder(false);
            })
            .catch((error) => {
              setError(
                error.message || "Failed to sync order. Please try again."
              );
              setSnackVisible(true);
              setIsLoadingOrder(false);
            });
        }
      })
      .catch((error) => {
        setError(error.message || "Error retrieving pending order.");
        setSnackVisible(true);
        setIsLoadingOrder(false);
      });
  };

  const payOrder = useCallback(() => {
    if (!orderId) return;
    setIsLoadingPayment(true);
    fetch(`https://kanpla-code-challenge.up.railway.app/payments`, {
      method: "POST",
      headers: {
        "x-auth-user": AUTH_USER_TOKEN,
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
              "x-auth-user": AUTH_USER_TOKEN,
            },
            body: JSON.stringify({
              status: "completed",
            }),
          }
        )
          .then((response) =>
            response.status === 201 ? response.json() : Promise.reject(response)
          )
          .then(() => {
            setBasket([]);
            setOrderId(null);
            setIsLoadingPayment(false);
          })
          .catch((error) => {
            setError(
              error.message || "Failed to complete payment. Please try again."
            );
            setSnackVisible(true);
            setIsLoadingPayment(false);
          });
      })
      .catch((error) => {
        setError(
          error.message || "Failed to process payment. Please try again."
        );
        setSnackVisible(true);
        setIsLoadingPayment(false);
      });
  }, [orderId, basket]);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.productGrid}>
        {isLoadingProducts ? (
          //TODO: use skeleton loaders to improve UX
          <ActivityIndicator
            size="large"
            color="#000000"
            style={styles.loadingIndicator}
          />
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={2}
          />
        )}
      </ThemedView>

      <ThemedView style={styles.basket}>
        <ThemedText type="title" style={styles.text}>
          Basket
        </ThemedText>

        <ScrollView>
          {basket.map((item, index) => (
            <ThemedView key={index} style={styles.basketItem}>
              <Text style={styles.text}>{item.name}</Text>
              <Text style={styles.text}>
                ${(item.price_unit * (item.vat_rate + 1)).toFixed(2)}
              </Text>
            </ThemedView>
          ))}
        </ScrollView>

        {isSnackVisible ? (
          <Snackbar
            visible={isSnackVisible}
            onDismiss={() => setSnackVisible(false)}
            duration={3000}
            action={{
              label: "Dismiss",
              onPress: () => setSnackVisible(false),
            }}
          >
            {error}
          </Snackbar>
        ) : null}

        <ThemedText style={styles.text}>
          Total: $
          {basket
            .reduce(
              (acc, item) => acc + item.price_unit * (item.vat_rate + 1),
              0
            )
            .toFixed(2)}
        </ThemedText>

        <TouchableOpacity
          style={styles.button}
          onPress={createOrder}
          disabled={isLoadingOrder}
        >
          {isLoadingOrder ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Create Order</ThemedText>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !orderId && { backgroundColor: "#555" }]}
          onPress={payOrder}
          disabled={!orderId || isLoadingPayment}
        >
          {isLoadingPayment ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>Pay</ThemedText>
          )}
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  productGrid: {
    flex: 2,
    padding: 10,
  },
  product: {
    flex: 1,
    margin: 10,
    padding: 10,
    backgroundColor: "#1e1e1e",
    alignItems: "center",
  },
  basket: {
    flex: 1,
    padding: 10,
    backgroundColor: "#1e1e1e",
  },
  basketItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "gray",
    marginVertical: 5,
    padding: 5,
  },
  text: {
    color: "#ffffff",
  },
  button: {
    backgroundColor: "#173829",
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
