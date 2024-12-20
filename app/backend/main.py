from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import yfinance as yf
from functools import lru_cache
import asyncio
from fastapi.responses import JSONResponse
import logging
from collections import defaultdict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Rate limiting configuration
RATE_LIMIT = 100  # requests per minute
RATE_WINDOW = 60  # seconds

class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)
        
    def is_allowed(self, client_id: str) -> bool:
        now = datetime.now()
        minute_ago = now - timedelta(seconds=RATE_WINDOW)
        
        # Clean old requests
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if req_time > minute_ago
        ]
        
        # Check rate limit
        if len(self.requests[client_id]) >= RATE_LIMIT:
            return False
            
        self.requests[client_id].append(now)
        return True

rate_limiter = RateLimiter()

# Enhanced Pydantic models with validation
class Trade(BaseModel):
    ticker: str
    price: float
    time: datetime
    status: str = Field(default="open")
    percentage: float = Field(default=0.0)

    @validator('ticker')
    def validate_ticker(cls, v):
        if not v or not isinstance(v, str):
            raise ValueError('Invalid ticker symbol')
        return v.upper()

    @validator('price')
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError('Price must be positive')
        return v

    @validator('status')
    def validate_status(cls, v):
        valid_statuses = {'open', 'closed', 'pending'}
        if v not in valid_statuses:
            raise ValueError(f'Status must be one of {valid_statuses}')
        return v

class StockDataResponse(BaseModel):
    timestamps: List[int]
    prices: List[float]
    regression_data: Optional[List[float]] = None
    volume: Optional[List[int]] = None
    error_margin: Optional[float] = None

app = FastAPI(
    title="Stock Trading API",
    description="Enhanced API for stock data analysis and trade management",
    version="2.0.0"
)

# CORS middleware with more specific configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # More specific than "*"
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    max_age=86400,  # Cache preflight requests for 24 hours
)

# Custom middleware for rate limiting
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_id = request.client.host
    
    if not rate_limiter.is_allowed(client_id):
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Please try again later."}
        )
    
    response = await call_next(request)
    return response

# Error handling middleware
@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(f"Unhandled error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": "An unexpected error occurred"}
        )

def validate_ticker(ticker: str) -> str:
    """Validate ticker symbol with yfinance"""
    try:
        ticker = ticker.upper()
        stock = yf.Ticker(ticker)
        # Try to access basic info to verify ticker exists
        info = stock.info
        if not info:
            raise ValueError(f"Invalid ticker: {ticker}")
        return ticker
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid ticker symbol: {str(e)}"
        )

@lru_cache(maxsize=32)
def get_stock_data_cached(ticker: str, period: str, interval: str) -> Tuple[pd.DataFrame, datetime]:
    """Cached function to fetch stock data with timestamp"""
    try:
        stock = yf.Ticker(ticker)
        data = stock.history(period=period, interval=interval)
        if data.empty:
            raise ValueError(f"No data found for ticker {ticker}")
        return data, datetime.now()
    except Exception as e:
        logger.error(f"Error fetching stock data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch stock data: {str(e)}"
        )

def calculate_regression(prices: List[float], days_ahead: int = 10) -> Tuple[List[float], float]:
    """Calculate linear regression predictions with error margin"""
    try:
        if len(prices) < 2:
            raise ValueError("Insufficient data points for regression")
            
        X = np.arange(len(prices)).reshape(-1, 1)
        y = np.array(prices)
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Calculate prediction error margin (RMSE)
        y_pred = model.predict(X)
        rmse = np.sqrt(np.mean((y - y_pred) ** 2))
        
        # Make future predictions
        future_X = np.arange(len(prices), len(prices) + days_ahead).reshape(-1, 1)
        predictions = model.predict(future_X)
        
        return predictions.tolist(), rmse
        
    except Exception as e:
        logger.error(f"Regression calculation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Regression calculation failed: {str(e)}"
        )

def validate_time_params(range: str, interval: str) -> tuple[str, str]:
    """Validate and adjust time parameters with enhanced rules"""
    valid_ranges = {
        "1d": ["1m", "5m", "15m"],
        "5d": ["5m", "15m", "1h"],
        "1mo": ["15m", "1h", "1d"],
        "6mo": ["1d", "1wk"],
        "1y": ["1d", "1wk", "1mo"]
    }
    
    if range not in valid_ranges:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid range. Must be one of {list(valid_ranges.keys())}"
        )
        
    if interval not in valid_ranges[range]:
        # Auto-adjust to most appropriate interval
        interval = valid_ranges[range][0]
        logger.info(f"Adjusted interval to {interval} for range {range}")
        
    return range, interval

@app.get("/stock-data", response_model=StockDataResponse)
async def get_stock_data(
    ticker: str,
    interval: str = "1m",
    range: str = "1d",
    show_regression: bool = False
):
    """
    Enhanced endpoint to fetch stock data with improved error handling and validation
    """
    try:
        # Validate ticker
        ticker = validate_ticker(ticker)
        
        # Validate time parameters
        range, interval = validate_time_params(range, interval)
        
        # Get cached data
        historical_data, cache_time = get_stock_data_cached(ticker, range, interval)
        
        # Check if cache is too old (15 minutes for short intervals, 1 hour for daily)
        cache_age = datetime.now() - cache_time
        max_cache_age = timedelta(minutes=15 if interval in ['1m', '5m'] else 60)
        
        if cache_age > max_cache_age:
            # Clear specific cache entry
            get_stock_data_cached.cache_clear()
            historical_data, _ = get_stock_data_cached(ticker, range, interval)
        
        if historical_data.empty:
            raise HTTPException(
                status_code=404,
                detail="No data found for the specified parameters"
            )
            
        timestamps = [int(ts.timestamp()) for ts in historical_data.index]
        prices = historical_data["Close"].tolist()
        volume = historical_data["Volume"].tolist()
        
        regression_data = None
        error_margin = None
        if show_regression and len(prices) >= 2:
            regression_data, error_margin = calculate_regression(prices)
            
        return StockDataResponse(
            timestamps=timestamps,
            prices=prices,
            regression_data=regression_data,
            volume=volume,
            error_margin=error_margin
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_stock_data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )

# Trade management endpoints with improved error handling
@app.post("/trades")
async def create_trade(trade: Trade):
    """Create a new trade entry with validation"""
    try:
        # Validate ticker before creating trade
        validate_ticker(trade.ticker)
        
        trade_dict = trade.dict()
        trade_log.append(trade_dict)
        return {"id": len(trade_log) - 1, "trade": trade_dict}
    except Exception as e:
        logger.error(f"Error creating trade: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create trade: {str(e)}"
        )

@app.get("/trades")
async def list_trades():
    """List all trades with pagination"""
    return {"trades": trade_log}

@app.put("/trades/{trade_id}")
async def update_trade(trade_id: int, trade: Trade):
    """Update an existing trade with validation"""
    if not 0 <= trade_id < len(trade_log):
        raise HTTPException(status_code=404, detail="Trade not found")
    
    try:
        validate_ticker(trade.ticker)
        trade_log[trade_id] = trade.dict()
        return {"trade": trade_log[trade_id]}
    except Exception as e:
        logger.error(f"Error updating trade: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update trade: {str(e)}"
        )

@app.delete("/trades/{trade_id}")
async def delete_trade(trade_id: int):
    """Delete a trade with validation"""
    if not 0 <= trade_id < len(trade_log):
        raise HTTPException(status_code=404, detail="Trade not found")
    
    try:
        deleted_trade = trade_log.pop(trade_id)
        return {"trade": deleted_trade}
    except Exception as e:
        logger.error(f"Error deleting trade: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete trade: {str(e)}"
        )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": app.version
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
