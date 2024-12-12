

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  zoomPlugin
);

const formatTimestamps = (timestamps, range, interval) => {
  return timestamps.map((ts) => {
    const date = new Date(ts * 1000);
    
    // Different formatting based on range and interval
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

  const handleChartClick = async (event, chartElement) => {
    if (chartElement.length > 0) {
      const clickedIndex = chartElement[0]._index;  // Get the clicked point index
      const clickedTimestamp = labels[clickedIndex];  // Get the timestamp from labels

      try {
        const timestamp = parseInt(clickedTimestamp);

        if (!ticker || !timestamp) {
          console.error("Ticker or Timestamp is missing.");
          return;
        }

        const response = await axios.get("http://127.0.0.1:8000/stock-data-by-timestamp", {
          params: { ticker, timestamp },
        });

        const { price, timestamp: dataTimestamp, open, high, low } = response.data;

        setNewTrade({
          price: price.toFixed(2),
          time: new Date(dataTimestamp * 1000).toLocaleString(),
          status: "open",
          ticker: ticker,
          open: open,
          high: high,
          low: low,
          percentage: 0,
        });
      } catch (error) {
        console.error("Error fetching data for clicked point:", error);
      }
    }
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

  const chartData = {
    labels,
    datasets: [
      {
        label: `${ticker} Price`,
        data,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      title: {
        display: true,
        text: `Live Stock Data for ${ticker}`,
      },
      tooltip: {
        callbacks: {
          title: function (tooltipItem) {
            const label = tooltipItem[0].label;
            return label;
          },
          label: function (tooltipItem) {
            const value = tooltipItem.raw;
            return `Price: ${value.toFixed(2)} USD`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Time",
        },
        ticks: {
          maxRotation: 45,
          autoSkip: true,
          autoSkipPadding: 10,
        },
      },
      y: {
        title: {
          display: true,
          text: "Price (USD)",
        },
        min: Math.min(...data) - 1,
        max: Math.max(...data) + 1,
      },
    },
    onClick: handleChartClick,
  };

  return (
    <div style={{ padding: "20px", display: "flex", justifyContent: "space-between" }}>
      <div style={{ width: "70%" }}>
        <h1>Stock Chart Viewer</h1>
        <Line data={chartData} options={chartOptions} />
      </div>

      <div style={{ width: "25%", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="ticker">Ticker Symbol: </label>
          <input
            id="ticker"
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="Enter ticker symbol"
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="range">Range: </label>
          <select
            id="range"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="1d">1 Day</option>
            <option value="5d">5 Days</option>
            <option value="1mo">1 Month</option>
            <option value="6mo">6 Months</option>
            <option value="1y">1 Year</option>
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="interval">Interval: </label>
          <select
            id="interval"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
          >
            <option value="1m">1 Minute</option>
            <option value="5m">5 Minutes</option>
            <option value="15m">15 Minutes</option>
            <option value="1h">1 Hour</option>
            <option value="1d">1 Day</option>
          </select>
        </div>

        <h2>Log Trade</h2>
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="price">Price: </label>
          <input
            id="price"
            type="text"
            name="price"
            value={newTrade.price}
            onChange={(e) => setNewTrade({ ...newTrade, price: e.target.value })}
            placeholder="Price"
          />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="time">Time: </label>
          <input
            id="time"
            type="text"
            name="time"
            value={newTrade.time}
            onChange={(e) => setNewTrade({ ...newTrade, time: e.target.value })}
            placeholder="Time"
          />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="status">Status: </label>
          <input
            id="status"
            type="text"
            name="status"
            value={newTrade.status}
            onChange={(e) => setNewTrade({ ...newTrade, status: e.target.value })}
            placeholder="Status"
          />
        </div>
        <button onClick={handleAddTrade}>Log Trade</button>

        <h2>Trade Log</h2>
        <table>
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Price</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tradeLog.map((trade, index) => (
              <tr key={index}>
                <td>{trade.ticker}</td>
                <td>{trade.price}</td>
                <td>{trade.time}</td>
                <td>{trade.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockChartViewer;
