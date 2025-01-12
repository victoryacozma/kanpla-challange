import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
} from "react-native";
import { Product } from "@/app/models/Product";
import { styles } from "@/app/screens/PosScreen/styles";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { usePayOrder } from "@/hooks/usePayOrder";
import { Snackbar } from "react-native-paper";
import { useCreateOrder } from "@/hooks/useCreateOrder";

const AUTH_USER_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJleHBpcmVzSW4iOiIxMGQiLCJzdWIiOiJ2aWN0b3J5YS5jb3ptYUBnbWFpbC5jb20ifQ.4TbzcbPw1TalmrO4nXsAn98r127iMOL6xGcFBs83pEg"; // use your own token

export default function PosScreen() {
  const [basket, setBasket] = useState<Product[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const {
    products,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useFetchProducts(AUTH_USER_TOKEN);
  const {
    createOrder,
    isLoading: isLoadingOrder,
    error: orderError,
  } = useCreateOrder(AUTH_USER_TOKEN);
  const {
    payOrder,
    isLoading: isLoadingPayment,
    error: paymentError,
  } = usePayOrder(AUTH_USER_TOKEN, orderId, setOrderId);
  const [isSnackVisible, setSnackVisible] = useState(false);

  const handleCreateOrder = () => {
    createOrder(basket);
  };

  const handlePayOrder = () => {
    payOrder(orderId, basket, setBasket);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.product}
      onPress={() => setBasket((prev) => [...prev, item])}
    >
      <Text style={styles.text}>{item.name}</Text>
      <Text style={styles.text}>${item.price_unit * (item.vat_rate + 1)}</Text>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.productGrid}>
        {isLoadingProducts ? (
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

        {basket.map((item, index) => (
          <ThemedView key={index} style={styles.basketItem}>
            <Text style={styles.text}>{item.name}</Text>
            <Text style={styles.text}>${item.price_unit}</Text>
          </ThemedView>
        ))}

        {isSnackVisible && (
          <Snackbar
            visible={isSnackVisible}
            onDismiss={() => setSnackVisible(false)}
            duration={3000}
            action={{
              label: "Dismiss",
              onPress: () => setSnackVisible(false),
            }}
          >
            {productsError || orderError || paymentError}
          </Snackbar>
        )}

        <ThemedText style={styles.text}>
          Total: ${basket.reduce((acc, item) => acc + item.price_unit, 0)}
        </ThemedText>

        <TouchableOpacity
          style={styles.button}
          onPress={handleCreateOrder}
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
          onPress={handlePayOrder}
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
function useFetchProducts(AUTH_USER_TOKEN: string): {
  products: any;
  isLoading: any;
  error: any;
} {
  throw new Error("Function not implemented.");
}
