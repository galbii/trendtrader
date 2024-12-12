
import React from 'react';

const TradeForm = ({ newTrade, setNewTrade, handleAddTrade }) => {
  return (
    <div>
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
    </div>
  );
};

export default TradeForm;
