from fastapi import FastAPI, HTTPException
import yfinance as yf
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# In-memory trade log (this would typically be a database in a production app)
trade_log = []

@app.get("/stock-data")
def get_stock_data(ticker: str, interval: str = "1m", range: str = "1d"):
    try:
        # Use yfinance to fetch stock data
        stock_data = yf.Ticker(ticker)

        # Adjust period and interval based on range
        if range == "1d":
            period = "1d"
            if interval not in ["1m", "5m", "15m"]:
                interval = "1m"
        elif range == "5d":
            period = "5d"
            if interval not in ["5m", "15m", "1h"]:
                interval = "5m"
        elif range == "1mo":
            period = "1mo"
            if interval not in ["15m", "1h"]:
                interval = "1h"
        elif range == "6mo":
            period = "6mo"
            interval = "1d"
        elif range == "1y":
            period = "1y"
            interval = "1d"
        else:
            period = "1d"
            interval = "1m"

        # Fetch historical market data
        historical_data = stock_data.history(period=period, interval=interval)

        if historical_data.empty:
            raise HTTPException(status_code=404, detail="No data found for the given parameters")

        # Extract timestamps and closing prices
        timestamps = historical_data.index.tolist()  # Pandas Index object
        prices = historical_data["Close"].tolist()   # Extracting 'Close' prices

        # Convert timestamps to UNIX timestamps (seconds since 1970)
        timestamps = [int(ts.timestamp()) for ts in timestamps]

        return {"timestamps": timestamps, "prices": prices}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stock data: {str(e)}")

@app.post("/log-trade")
def log_trade(trade: Dict):
    # Store the trade (e.g., {"ticker": "AAPL", "price": 150, "time": "2024-12-10T14:45", "status": "open"})
    trade_log.append(trade)
    return {"message": "Trade logged successfully", "trade": trade}

@app.put("/update-trade/{trade_id}")
def update_trade(trade_id: int, trade: Dict):
    # Modify an existing trade based on trade_id
    if 0 <= trade_id < len(trade_log):
        trade_log[trade_id].update(trade)
        return {"message": "Trade updated successfully", "trade": trade_log[trade_id]}
    raise HTTPException(status_code=404, detail="Trade not found")

@app.delete("/opt-out-trade/{trade_id}")
def opt_out_trade(trade_id: int):
    # Remove a trade from the log
    if 0 <= trade_id < len(trade_log):
        removed_trade = trade_log.pop(trade_id)
        return {"message": "Trade removed", "trade": removed_trade}
    raise HTTPException(status_code=404, detail="Trade not found")

@app.get("/trade-log")
def get_trade_log():
    return {"trade_log": trade_log}


