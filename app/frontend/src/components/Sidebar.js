
// components/Sidebar.js

import React from "react";
import IndicatorsToggle from "./IndicatorsToggle"; // Import IndicatorsToggle

const Sidebar = ({
  ticker,
  range,
  interval,
  showSMA,
  showEMA,
  showMACD,
  showRSI,
  smaPeriod,
  emaPeriod,
  setTicker,
  setRange,
  setInterval,
  setShowSMA,
  setShowEMA,
  setShowMACD,
  setShowRSI,
  setSmaPeriod,
  setEmaPeriod,
}) => (
  <div style={{ width: "25%", display: "flex", flexDirection: "column" }}>
    {/* Ticker Input */}
    <div style={{ marginBottom: "20px" }}>
      <label htmlFor="ticker">Ticker Symbol: </label>
      <input
        id="ticker"
        type="text"
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
      />
    </div>

    {/* Range Selector */}
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

    {/* Interval Selector */}
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

    {/* Indicators Toggle */}
    <IndicatorsToggle
      showSMA={showSMA}
      showEMA={showEMA}
      showMACD={showMACD}
      showRSI={showRSI}
      smaPeriod={smaPeriod}
      emaPeriod={emaPeriod}
      setShowSMA={setShowSMA}
      setShowEMA={setShowEMA}
      setShowMACD={setShowMACD}
      setShowRSI={setShowRSI}
      setSmaPeriod={setSmaPeriod}
      setEmaPeriod={setEmaPeriod}
    />
  </div>
);

export default Sidebar;
