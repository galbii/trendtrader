
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StockChart from './StockChart';
import TradeForm from './TradeForm';
import TradeLog from './TradeLog';

const StockChartViewer = () => {
  const [ticker, setTicker] = useState("AAPL");
  const [data, setData] = useState([]);
  const [labels, setLabels] = useState([]);
  const [range, setRange] = useState("1d");
  const [interval, setInterval] = useState("1m");
  const [tradeLog, setTradeLog] = useState([]);
  const [newTrade, setNewTrade] = useState({ price: "", time: "", status: "open", percentage: 0 });

  const fetchStockData = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/stock-data", {
        params: { ticker, range, interval },
      });
      const { timestamps, prices } = response.data;
      const formattedLabels = formatTimestamps(timestamps, range, interval);
      setLabels(formattedLabels);
      setData(prices);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, [ticker, range, interval]);

  const formatTimestamps = (timestamps, range, interval) => {
    return timestamps.map((ts) => {
      const date = new Date(ts * 1000);
      switch (range) {
        case '1d':
          return interval === '1m' || interval === '5m' 
            ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            : date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
        case '5d':
        case '1mo':
        case '6mo':
        case '1y':
          return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
        default:
          return date.toLocaleDateString();
      }
    });
  };

  const handleAddTrade = async () => {
    const newTradeData = {
      ticker,
      price: newTrade.price,
      time: newTrade.time,
      status: newTrade.status,
      percentage: 0, 
    };

    try {
      await axios.post("http://localhost:8000/log-trade", newTradeData);
      setTradeLog([...tradeLog, newTradeData]);
      setNewTrade({ price: "", time: "", status: "open", percentage: 0 });
    } catch (error) {
      console.error("Error logging trade:", error);
    }
  };

  return (
    <div style={{ padding: "20px", display: "flex", justifyContent: "space-between" }}>
      <div style={{ width: "70%" }}>
        <h1>Stock Chart Viewer</h1>
        <StockChart 
          ticker={ticker}
          labels={labels}
          data={data}
          range={range}
          interval={interval}
          setTicker={setTicker}
          setRange={setRange}
          setInterval={setInterval}
        />
      </div>

      <div style={{ width: "25%", display: "flex", flexDirection: "column" }}>
        <TradeForm 
          newTrade={newTrade}
          setNewTrade={setNewTrade}
          handleAddTrade={handleAddTrade}
        />
        <TradeLog tradeLog={tradeLog} />
      </div>
    </div>
  );
};

export default StockChartViewer;
