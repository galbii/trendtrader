
import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000';  // Backend URL

export const fetchStockData = async (ticker, range, interval) => {
  try {
    const response = await axios.get(`${BASE_URL}/stock-data`, {
      params: { ticker, range, interval },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching stock data: ${error.message}`);
  }
};

export const fetchStockDataByTimestamp = async (ticker, timestamp) => {
  try {
    const response = await axios.get(`${BASE_URL}/stock-data-by-timestamp`, {
      params: { ticker, timestamp },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching data for timestamp: ${error.message}`);
  }
};

export const logTrade = async (trade) => {
  try {
    const response = await axios.post(`${BASE_URL}/log-trade`, trade);
    return response.data;
  } catch (error) {
    throw new Error(`Error logging trade: ${error.message}`);
  }
};

export const getTradeLog = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/trade-log`);
    return response.data.trade_log;
  } catch (error) {
    throw new Error(`Error fetching trade log: ${error.message}`);
  }
};
