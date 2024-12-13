
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
import './App.css';

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
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);
  const [smaPeriod, setSmaPeriod] = useState(14);  // Default SMA period is 14
  const [smaData, setSmaData] = useState([]);
  const [emaData, setEmaData] = useState([]);
  const [emaPeriod, setEmaPeriod] = useState(14);  // Default EMA period is 14
  const [macdData, setMacdData] = useState([]);
  const [rsiData, setRsiData] = useState([]);
  const [showMACD, setShowMACD] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [predictedPrices, setPredictedPrices] = useState(false);
const [showRegression, setShowRegression] = useState(false);
const [regressionData, setRegressionData] = useState(false);

const fetchStockData = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/stock-data", {
        params: { ticker, range, interval, show_regression: showRegression },
      });

      const { timestamps, prices, regression_data } = response.data;
      const formattedLabels = formatTimestamps(timestamps, range, interval);

      setLabels(formattedLabels);
      setData(prices);
      setRegressionData(regression_data); // Save regression data from backend

    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  };

const generateNextIntervals = (timestamps, interval, count = 10) => {
  const lastTimestamp = timestamps[timestamps.length - 1];
  const intervalInMs = interval * 1000; // Convert interval to milliseconds
  const nextIntervals = [];

  for (let i = 1; i <= count; i++) {
    const nextTimestamp = new Date(lastTimestamp * 1000 + i * intervalInMs);
    nextIntervals.push(nextTimestamp);
  }

  return nextIntervals;
};

const intervalToSeconds = (interval) => {
  switch (interval) {
    case '1m': return 60;
    case '5m': return 300;
    case '15m': return 900;
    case '1h': return 3600;
    case '1d': return 86400;
    default: return 86400;  // Default to 1 day
  }
};

const calculatePredictedPrice = (regression_data, nextTimestamp) => {
  // Assuming regression_data has the format [{timestamp, price}]
  const x1 = regression_data[regression_data.length - 1].timestamp;
  const y1 = regression_data[regression_data.length - 1].price;

  // Calculate the linear regression slope (this assumes linear data)
  const x0 = regression_data[regression_data.length - 2].timestamp;
  const y0 = regression_data[regression_data.length - 2].price;
  const slope = (y1 - y0) / (x1 - x0);  // Simple linear regression slope

  const predictedPrice = y1 + slope * (nextTimestamp - x1);
  return predictedPrice;
};


  useEffect(() => {
    fetchStockData();
  }, [ticker, range, interval, showRegression]);

const padData = (data, length) => {
  const padding = new Array(length - data.length).fill(null); // Pad with nulls
  return [...padding, ...data];  // Ensure the array starts with nulls
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
    ema.push(data[0]);  // Set the first EMA value as the first price

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

    const signal = calculateEMA(macd, 9);  // Signal line (9-period EMA of MACD)

    return { macd, signal };
  };

const calculateRSI = (data, period = 14) => {
  let gains = 0;
  let losses = 0;
  const rsi = [];

  // Initial RSI calculation (first 14 periods)
  for (let i = 1; i <= period; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) gains += change;
    if (change < 0) losses -= change;
  }
  rsi.push(100 - (100 / (1 + (gains / losses))));

  // Calculate RSI for the remaining data points
  for (let i = period; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains = change > 0 ? change : 0;
    losses = change < 0 ? -change : 0;

    const avgGain = (gains + (gains * (period - 1))) / period;
    const avgLoss = (losses + (losses * (period - 1))) / period;

    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }

  // Normalize RSI to [-1, 1]
  const normalizedRsi = rsi.map(value => 2 * ((value - 0) / (100 - 0)) - 1);

  return normalizedRsi;
};

const normalizeMACD = (macdData, min = -100, max = 100) => {
  const minMACD = Math.min(...macdData);
  const maxMACD = Math.max(...macdData);
  return macdData.map(value => {
    // Normalize MACD to range [0, 100]
    return ((value - minMACD) / (maxMACD - minMACD)) * (max - min) + min;
  });
};

useEffect(() => {
    if (data.length > 0) {
      if (showSMA) {
        setSmaData(calculateSMA(data, smaPeriod));
      }
      if (showEMA) {
        setEmaData(calculateEMA(data, emaPeriod));
      }

      const { macd, signal } = calculateMACD(data);
      const normalizedMacd = normalizeMACD(macd);
      const normalizedRsi = calculateRSI(data);

      // Pad the MACD, RSI, SMA, and EMA arrays to match the data length
      setMacdData(padData(normalizedMacd, data.length));
      setRsiData(padData(normalizedRsi, data.length));
    }
  }, [data, showSMA, showEMA, smaPeriod, emaPeriod]);

const normalizeData = (data) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    return data.map((value) => (2 * (value - min)) / (max - min) - 1);  // Normalize to -1 to 1
  };

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

// Handle Add Trade
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

  // Handle Removing a Trade
  const handleRemoveTrade = (index) => {
    const updatedLog = tradeLog.filter((_, i) => i !== index);
    setTradeLog(updatedLog);
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
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: "rgba(75, 192, 192, 1)",
      pointBorderColor: "#fff",
    },
    showSMA && {
      label: `SMA (${smaPeriod} Period)`,
      data: smaData,
      borderColor: "rgba(255, 99, 132, 1)",
      backgroundColor: "rgba(255, 99, 132, 0.2)",
      borderWidth: 2,
      fill: false,
    },
    showEMA && {
      label: `EMA (${emaPeriod} Period)`,
      data: emaData,
      borderColor: "rgba(153, 102, 255, 1)",
      backgroundColor: "rgba(153, 102, 255, 0.2)",
      borderWidth: 2,
      fill: false,
    },
	showRegression && {
        label: "Regression Line",
        data: regressionData,
        borderColor: "rgba(255, 159, 64, 1)",
        backgroundColor: "rgba(255, 159, 64, 0.2)",
        borderWidth: 2,
        fill: false,
      }
  ].filter(Boolean),
};

const macdRsiData = {
    labels,
    datasets: [
      showMACD && {
        label: "MACD",
        data: padData(normalizeData(macdData), labels.length),  // Pad MACD to match labels length
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
      },
      showRSI && {
        label: "RSI",
        data: padData(rsiData, labels.length),  // Pad RSI to match labels length
        borderColor: "rgba(255, 159, 64, 1)",
        backgroundColor: "rgba(255, 159, 64, 0.2)",
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
      },
    ].filter(Boolean),
  };


const chartOptions = {
  responsive: true,
  scales: {
    x: {
      type: 'category',
      ticks: {
        maxRotation: 45,
        autoSkip: true,
        autoSkipPadding: 10,
      },
      min: 0,
      max: labels.length - 1, // Ensure you have a maximum x-value based on data length
    },
    y: {
      beginAtZero: false,
      ticks: {
        max: Math.max(...data),  // Adjust Y-axis to data range
        min: Math.min(...data),  // Adjust Y-axis to data range
        stepSize: 0.5,
      },
    },
  },
  plugins: {
    zoom: {
      pan: {
        enabled: true,
        mode: 'xy',
        speed: 5, // Adjust panning speed for smoother experience
        threshold: 10,  // Set panning threshold for better user experience
        onPan: ({ chart }) => {
          const { left, right } = chart.scales.x;
          const { dataLength } = chart.config.data.labels;
          const middleIndex = dataLength - 1;

          // Check if the chart has been scrolled to the rightmost part
          if (right === middleIndex) {
            chart.resetZoom();  // Reset the zoom if the rightmost part reaches the center
          }
        },
      },
      zoom: {
        enabled: true,
        mode: 'xy',
      },
    },
  },
  onClick: handleChartClick,
};

const macdRsiOptions = {
  responsive: true,
  scales: {
    x: {
      title: {
        display: true,
        text: "Time",
      },
      type: 'category',
      ticks: {
        maxRotation: 45,
        autoSkip: true,
        autoSkipPadding: 10,
      },
    },
    y: {
      title: {
        display: true,
        text: "Value",
      },
      min: -1, // Minimum for normalized RSI
      max: 1,  // Maximum for normalized RSI
      ticks: {
        stepSize: 0.5,
      },
    },
  },
};

return (
  <div className="container">
    {/* Header with Caption in the Center */}
    <header style={{
      backgroundColor: "#333", 
      color: "#fff", 
      padding: "10px 0", 
      textAlign: "center", 
      fontSize: "24px", 
      fontWeight: "bold"
    }}>
      Trend Trader
    </header>

    {/* Main Content Layout */}
    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", paddingTop: "20px" }}>
      {/* Left Section (Charts) */}
      <div style={{ flex: "2", maxWidth: "60%", marginRight: "20px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Line data={chartData} options={{ responsive: true }} />
        </div>
        {(showMACD || showRSI) && (
          <div style={{ marginBottom: "20px" }}>
            <Line data={macdRsiData} options={macdRsiOptions} />
          </div>
        )}
      </div>

      {/* Right Section (Sidebar with Controls and Trade Log) */}
      <div style={{ flex: "1", maxWidth: "35%" }}>
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

        {/* Sidebar Section */}
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

        {/* Controls for SMA, EMA, MACD, and RSI */}
        <div style={{ marginBottom: "20px" }}>
          <label>
            <input
              type="checkbox"
              checked={showSMA}
              onChange={() => setShowSMA(!showSMA)}
            />
            Show SMA
          </label>
          <input
            type="number"
            value={smaPeriod}
            onChange={(e) => setSmaPeriod(parseInt(e.target.value))}
            placeholder="SMA Period"
            disabled={!showSMA}
          />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label>
            <input
              type="checkbox"
              checked={showRegression}
              onChange={() => setShowRegression(!showRegression)}
            />
            Regression
          </label>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label>
            <input
              type="checkbox"
              checked={showEMA}
              onChange={() => setShowEMA(!showEMA)}
            />
            Show EMA
          </label>
          <input
            type="number"
            value={emaPeriod}
            onChange={(e) => setEmaPeriod(parseInt(e.target.value))}
            placeholder="EMA Period"
            disabled={!showEMA}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label>
            <input
              type="checkbox"
              checked={showMACD}
              onChange={() => setShowMACD(!showMACD)}
            />
            Show MACD
          </label>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label>
            <input
              type="checkbox"
              checked={showRSI}
              onChange={() => setShowRSI(!showRSI)}
            />
            Show RSI
          </label>
        </div>

        {/* Trade Form */}
        <div style={{ marginBottom: "20px" }}>
          <h3>Log Trade</h3>
          <input
            type="number"
            value={newTrade.price}
            onChange={(e) => setNewTrade({ ...newTrade, price: e.target.value })}
            placeholder="Price"
          />
          <button onClick={handleAddTrade}>Log Trade</button>
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
      </div>

      {/* New Flex container for MACD graph and regression table */}
      <div style={{ display: "flex", flexDirection: "column", marginLeft: "20px", width: "400px" }}>
        {/* Regression Table */}
        <div className="regression-table" style={{ marginTop: "10px" }}>
          <h3>Regression</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Predicted Price</th>
              </tr>
            </thead>
            <tbody>
              {regressionData && regressionData.length > 0 && regressionData.slice(0, 10).map((price, index) => (
                <tr key={index}>
                  <td>{price.toFixed(2)}</td> {/* Display predicted price */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Trade Log Table */}
        <div style={{ marginTop: "20px" }}>
          <h3>Trade Log</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Remove</th>
                <th>Ticker</th>
                <th>Time</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {tradeLog.length > 0 ? (
                tradeLog.map((trade, index) => (
                  <tr key={index}>
                    <td>
                      <button onClick={() => handleRemoveTrade(index)} style={{ color: "red", cursor: "pointer" }}>x</button>
                    </td>
                    <td>{trade.ticker}</td>
                    <td>{trade.time}</td>
                    <td>{trade.price}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No trades logged yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);
};
export default StockChartViewer;
