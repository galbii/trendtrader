
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000", // Backend API URL
});

export const fetchStockData = async (ticker, range, interval) => {
  try {
    const response = await api.get("/stock-data", {
      params: { ticker, range, interval },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching stock data:", error);
    throw error;
  }
};

export const fetchStockDataByTimestamp = async (ticker, timestamp) => {
  try {
    const response = await api.get("/stock-data-by-timestamp", {
      params: { ticker, timestamp },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching stock data by timestamp:", error);
    throw error;
  }
};

export const logTrade = async (tradeData) => {
  try {
    await api.post("/log-trade", tradeData);
  } catch (error) {
    console.error("Error logging trade:", error);
    throw error;
  }
};
