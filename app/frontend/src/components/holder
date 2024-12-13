import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TradeLog = ({ tradeLog, onUpdateTrade, onRemoveTrade, onAddTrade, newTrade, handleChange }) => {
  return (
    <div>
      <h1>Trade Manager</h1>

      <h2>Log New Trade</h2>
      <input
        type="text"
        name="ticker"
        placeholder="Ticker"
        value={newTrade.ticker}
        onChange={handleChange}
      />
      <input
        type="number"
        name="price"
        placeholder="Price"
        value={newTrade.price}
        onChange={handleChange}
      />
      <input
        type="text"
        name="time"
        placeholder="Time (e.g., 2024-12-10T14:45)"
        value={newTrade.time}
        onChange={handleChange}
      />
      <input
        type="text"
        name="status"
        placeholder="Status"
        value={newTrade.status}
        onChange={handleChange}
      />
      <button onClick={onAddTrade}>Log Trade</button>

      <h2>Trade Log</h2>
      <ul>
        {tradeLog.map((trade, index) => (
          <li key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            {/* "X" button to remove the trade */}
            <button 
              onClick={() => onRemoveTrade(index)} 
              style={{
                marginRight: '10px',
                background: 'red',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                padding: '5px 10px',
                cursor: 'pointer'
              }}
            >
              X
            </button>
            {/* Trade details */}
            {trade.ticker} - {trade.price} - {trade.time} - {trade.status}
            <button onClick={() => onUpdateTrade(index)}>Update</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TradeLog;
