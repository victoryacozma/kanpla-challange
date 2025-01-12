import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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
