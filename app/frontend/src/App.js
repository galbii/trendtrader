
import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
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
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";

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

const StockChartViewer = () => {
  const [ticker, setTicker] = useState("AAPL"); // Default ticker symbol
  const [data, setData] = useState([]); // Price data
  const [labels, setLabels] = useState([]); // Time labels
  const [range, setRange] = useState("1d"); // Default range
  const [interval, setInterval] = useState("1m"); // Default interval

  const fetchStockData = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/stock-data", {
        params: {
          ticker,
          range,
          interval,
        },
      });

      const { timestamps, prices } = response.data;

      const formattedLabels = timestamps.map((ts) =>
        new Date(ts * 1000).toLocaleTimeString()
      );

      setLabels(formattedLabels);
      setData(prices);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, [ticker, range, interval]);

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
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: "x",
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Time",
        },
      },
      y: {
        title: {
          display: true,
          text: "Price (USD)",
        },
        min: Math.min(...data) - 1, // Adjust Y-axis range dynamically
        max: Math.max(...data) + 1,
      },
    },
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Stock Chart Viewer</h1>
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="ticker">Ticker Symbol: </label>
        <input
          id="ticker"
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="Enter ticker symbol"
          style={{ marginRight: "10px" }}
        />
        <label htmlFor="range">Range: </label>
        <select
          id="range"
          value={range}
          onChange={(e) => setRange(e.target.value)}
          style={{ marginRight: "10px" }}
        >
          <option value="1d">1 Day</option>
          <option value="5d">5 Days</option>
          <option value="1mo">1 Month</option>
          <option value="6mo">6 Months</option>
          <option value="1y">1 Year</option>
        </select>
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
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default StockChartViewer;
