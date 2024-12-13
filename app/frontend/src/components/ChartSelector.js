
import React from 'react';

const ChartSelector = ({ chartType, setChartType }) => (
  <div style={{ marginBottom: "20px" }}>
    <label htmlFor="chartType">Select Chart Type: </label>
    <select
      id="chartType"
      value={chartType}
      onChange={(e) => setChartType(e.target.value)}
    >
      <option value="line">Line Chart</option>
      <option value="candlestick">Candlestick Chart</option>
    </select>
  </div>
);

export default ChartSelector;
