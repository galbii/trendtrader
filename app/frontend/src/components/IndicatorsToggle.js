
// components/IndicatorsToggle.js

import React from 'react';

const IndicatorsToggle = ({
  showSMA,
  showEMA,
  showMACD,
  showRSI,
  smaPeriod,
  emaPeriod,
  setShowSMA,
  setShowEMA,
  setShowMACD,
  setShowRSI,
  setSmaPeriod,
  setEmaPeriod,
}) => (
  <div style={{ marginBottom: "20px" }}>
    {/* SMA Toggle */}
    <div>
      <input
        type="checkbox"
        checked={showSMA}
        onChange={() => setShowSMA((prev) => !prev)}
      />
      <label>SMA (Period: {smaPeriod})</label>
      <input
        type="number"
        min="1"
        value={smaPeriod}
        onChange={(e) => setSmaPeriod(parseInt(e.target.value))}
      />
    </div>

    {/* EMA Toggle */}
    <div>
      <input
        type="checkbox"
        checked={showEMA}
        onChange={() => setShowEMA((prev) => !prev)}
      />
      <label>EMA (Period: {emaPeriod})</label>
      <input
        type="number"
        min="1"
        value={emaPeriod}
        onChange={(e) => setEmaPeriod(parseInt(e.target.value))}
      />
    </div>

    {/* MACD Toggle */}
    <div>
      <input
        type="checkbox"
        checked={showMACD}
        onChange={() => setShowMACD((prev) => !prev)}
      />
      <label>MACD</label>
    </div>

    {/* RSI Toggle */}
    <div>
      <input
        type="checkbox"
        checked={showRSI}
        onChange={() => setShowRSI((prev) => !prev)}
      />
      <label>RSI</label>
    </div>
  </div>
);

export default IndicatorsToggle;
