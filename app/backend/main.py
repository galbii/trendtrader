
from fastapi import FastAPI, HTTPException
import yfinance as yf
from typing import List
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

@app.get("/stock-data")
def get_stock_data(ticker: str, interval: str = "1m", range: str = "1d"):
    try:
        # Use yfinance to fetch stock data
        stock_data = yf.Ticker(ticker)

        # Fetch historical market data
        historical_data = stock_data.history(period=range, interval=interval)

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

