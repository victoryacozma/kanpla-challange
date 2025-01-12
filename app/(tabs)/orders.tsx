import React, { useEffect, useState } from "react";
import { FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { Snackbar } from "react-native-paper";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { format } from "date-fns/format";

type Order = {
  amount_total: number;
  basket_id: string | null;
  created_at: string;
  id: string;
  status: string;
  user_id: string;
};

const AUTH_USER_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJleHBpcmVzSW4iOiIxMGQiLCJzdWIiOiJ2aWN0b3J5YS5jb3ptYUBnbWFpbC5jb20ifQ.4TbzcbPw1TalmrO4nXsAn98r127iMOL6xGcFBs83pEg"; // use your own token

export default function TabTwoScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackVisible, setSnackVisible] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setError(null);
    try {
      const response = await fetch(
        "https://kanpla-code-challenge.up.railway.app/orders",
        {
          headers: {
            "x-auth-user": AUTH_USER_TOKEN,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Ooops, seems like something went wrong. Please try again later."
        );
      }

      const data = await response.json();
      setOrders(data);
      console.log("orders are: ", data);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      setError(error.message || "An unexpected error occurred.");
      setSnackVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, "MMMM dd, yyyy, h:mm a");
  };

  const renderItem = ({ item }: { item: Order }) => (
    <ThemedView style={styles.orderItem}>
      <ThemedText>Created by: {item.user_id}</ThemedText>
      <ThemedText>Created at: {formatDate(item.created_at)}</ThemedText>
      <ThemedText>Total: {item.amount_total}$</ThemedText>
      <ThemedText>Status: {item.status}</ThemedText>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Paid Orders</ThemedText>
      </ThemedView>

      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </ThemedView>
      ) : (
        <FlatList
          data={orders}
          style={styles.flatListContainer}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={3000}
        style={styles.snackBarContainer}
        action={{
          label: "Dismiss",
          onPress: () => setSnackVisible(false),
        }}
      >
        {error}
      </Snackbar>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
  },
  flatListContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  orderItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  snackBarContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
