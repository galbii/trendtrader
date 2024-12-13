import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
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
trade_log = []

def linear_regression_predict(prices: List[float], days_ahead: int = 10) -> List[float]:
    """
    Perform linear regression on historical prices and predict the next `days_ahead` prices.
    """
    if len(prices) < 2:
        raise ValueError("Not enough data to perform regression.")
    
    # Prepare data for linear regression
    data = pd.DataFrame(prices, columns=['price'])
    data['day'] = np.arange(len(prices))
    
    model = LinearRegression()
    model.fit(data[['day']], data['price'])

    # Predict future prices for the next `days_ahead` intervals
    future_days = np.arange(len(prices), len(prices) + days_ahead)
    predicted_prices = model.predict(future_days.reshape(-1, 1))

    print(predicted_prices)

    return predicted_prices.tolist()

@app.get("/stock-data")
def get_stock_data(ticker: str, interval: str = "1m", range: str = "1d", show_regression: bool = False):
    try:
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

        historical_data = stock_data.history(period=period, interval=interval)

        if historical_data.empty:
            raise HTTPException(status_code=404, detail="No data found for the given parameters")

        timestamps = historical_data.index.tolist()
        prices = historical_data["Close"].tolist()

        # Convert timestamps to Unix format
        timestamps = [int(ts.timestamp()) for ts in timestamps]

        regression_data = []
        if show_regression:
            regression_data = linear_regression_predict(prices, days_ahead=10)

        return {"timestamps": timestamps, "prices": prices, "regression_data": regression_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stock data: {str(e)}")

def adjust_period_and_interval(range: str, interval: str) -> (str, str):
    """
    Adjust the period and interval based on the requested range.
    """
    period_map = {
        "1d": ("1d", "1m"),
        "5d": ("5d", "5m"),
        "1mo": ("1mo", "1h"),
        "6mo": ("6mo", "1d"),
        "1y": ("1y", "1d")
    }

    period, default_interval = period_map.get(range, ("1d", "1m"))
    if interval not in ["1m", "5m", "15m", "1h", "1d"]:
        interval = default_interval
    return period, interval


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


