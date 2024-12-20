import { useState, useEffect } from 'react';
import axios from 'axios';

export const useStockChart = () => {
  const [ticker, setTicker] = useState("AAPL");
  const [data, setData] = useState([]);
  const [labels, setLabels] = useState([]);
  const [range, setRange] = useState("1d");
  const [interval, setInterval] = useState("1m");
  const [tradeLog, setTradeLog] = useState([]);
  const [newTrade, setNewTrade] = useState({ price: "", time: "", status: "open", percentage: 0 });
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);
  const [smaPeriod, setSmaPeriod] = useState(14);
  const [smaData, setSmaData] = useState([]);
  const [emaData, setEmaData] = useState([]);
  const [emaPeriod, setEmaPeriod] = useState(14);
  const [macdData, setMacdData] = useState({ macd: [], signal: [] });
  const [rsiData, setRsiData] = useState([]);
  const [showMACD, setShowMACD] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showRegression, setShowRegression] = useState(false);
  const [regressionData, setRegressionData] = useState(false);

  const formatTimestamps = (timestamps, range, interval) => {
    return timestamps.map((ts) => {
      const date = new Date(ts * 1000);
      switch (range) {
        case '1d':
          return interval === '1m' || interval === '5m' 
            ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            : date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
        case '5d':
          return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
        case '1mo':
          return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
        case '6mo':
          return date.toLocaleDateString([], {month: 'short', year: 'numeric'});
        case '1y':
          return date.toLocaleDateString([], {month: 'short', year: 'numeric'});
        default:
          return date.toLocaleDateString();
      }
    });
  };

  const fetchStockData = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/stock-data", {
        params: { ticker, range, interval, show_regression: showRegression },
      });

      const { timestamps, prices, regression_data } = response.data;
      const formattedLabels = formatTimestamps(timestamps, range, interval);

      setLabels(formattedLabels);
      setData(prices);
      setRegressionData(regression_data);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  };

  const calculateSMA = (data, period) => {
    const sma = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, price) => acc + price, 0);
      sma.push(sum / period);
    }
    return sma;
  };

  const calculateEMA = (data, period) => {
    const ema = [];
    const k = 2 / (period + 1);
    ema.push(data[0]);

    for (let i = 1; i < data.length; i++) {
      const value = (data[i] - ema[i - 1]) * k + ema[i - 1];
      ema.push(value);
    }
    return ema;
  };

  const calculateMACD = (data) => {
    const ema12 = calculateEMA(data, 12);
    const ema26 = calculateEMA(data, 26);
    const macd = ema12.slice(26 - 1).map((value, index) => value - ema26[index]);
    const signal = calculateEMA(macd, 9);
    return { macd, signal };
  };

  const calculateRSI = (data, period = 14) => {
    let gains = 0;
    let losses = 0;
    const rsi = [];

    for (let i = 1; i <= period; i++) {
      const change = data[i] - data[i - 1];
      if (change > 0) gains += change;
      if (change < 0) losses -= change;
    }
    rsi.push(100 - (100 / (1 + (gains / losses))));

    for (let i = period; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      gains = change > 0 ? change : 0;
      losses = change < 0 ? -change : 0;

      const avgGain = (gains + (gains * (period - 1))) / period;
      const avgLoss = (losses + (losses * (period - 1))) / period;

      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }

    return rsi.map(value => 2 * ((value - 0) / (100 - 0)) - 1);
  };

  const padData = (data, length) => {
    const padding = new Array(length - data.length).fill(null);
    return [...padding, ...data];
  };

  const normalizeData = (data) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    return data.map((value) => (2 * (value - min)) / (max - min) - 1);
  };

  const handleAddTrade = () => {
    const currentTime = new Date().toLocaleString();
    const newTradeData = {
      ticker,
      price: newTrade.price,
      time: currentTime,
      percentage: 0,
    };
    setTradeLog([...tradeLog, newTradeData]);
    setNewTrade({ price: "", percentage: 0 });
  };

  const handleRemoveTrade = (index) => {
    const updatedLog = tradeLog.filter((_, i) => i !== index);
    setTradeLog(updatedLog);
  };

  useEffect(() => {
    fetchStockData();
  }, [ticker, range, interval, showRegression]);

  useEffect(() => {
    if (data.length > 0) {
      if (showSMA) {
        setSmaData(calculateSMA(data, smaPeriod));
      }
      if (showEMA) {
        setEmaData(calculateEMA(data, emaPeriod));
      }

      const { macd, signal} = calculateMACD(data);
      const normalizedMacd = normalizeData(macd);
      const normalizedSignal = normalizeData(signal);
      const normalizedRsi = calculateRSI(data);

      setMacdData({
        macd: padData(normalizedMacd, data.length),
        signal: padData(normalizedSignal, data.length)
      });
      setRsiData(padData(normalizedRsi, data.length));
    }
  }, [data, showSMA, showEMA, smaPeriod, emaPeriod]);

  return {
    ticker,
    setTicker,
    data,
    labels,
    range,
    setRange,
    interval,
    setInterval,
    tradeLog,
    newTrade,
    setNewTrade,
    showSMA,
    setShowSMA,
    showEMA,
    setShowEMA,
    smaPeriod,
    setSmaPeriod,
    smaData,
    emaData,
    emaPeriod,
    setEmaPeriod,
    macdData,
    rsiData,
    showMACD,
    setShowMACD,
    showRSI,
    setShowRSI,
    showRegression,
    setShowRegression,
    regressionData,
    handleAddTrade,
    handleRemoveTrade,
  };
};
