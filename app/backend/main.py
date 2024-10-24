from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
import yfinance as yf

app = FastAPI()

# Helper function to get the stock data for a specific ticker and interval
def get_stock_data(ticker: str, interval: str):
    stock = yf.Ticker(ticker)
    
    # Mapping intervals to valid periods
    valid_intervals = {
        '1m': ('1d', '1m'),  # Use period of 1 day for 1-minute interval
        '5m': ('5d', '5m'),  # Use period of 5 days for 5-minute interval
        '15m': ('5d', '15m') # Use period of 5 days for 15-minute interval
    }
    
    if interval not in valid_intervals:
        raise HTTPException(status_code=400, detail="Invalid interval")

    period, yf_interval = valid_intervals[interval]
    
    # Fetch historical stock data based on period and interval
    stock_data = stock.history(period=period, interval=yf_interval)
    
    return {
        "times": stock_data.index.strftime('%Y-%m-%d %H:%M:%S').tolist(),
        "prices": stock_data['Close'].tolist()
    }

@app.post("/logs")
async def log_message(request: Request):
        log_entry = await request.json()
        print(f"Received log: {log_entry}")
                # Save the log to your logging system here
        return JSONResponse(content={"message": "Log received successfully"}, status_code=200)

# Route to get live stock data
@app.get("/stock/{ticker}/live")
async def live_stock_data(ticker: str):
    try:
        # Fetch live stock data (latest close price)
        stock = yf.Ticker(ticker)
        stock_data = stock.history(period="1d", interval="1m")
        last_record = stock_data.iloc[-1]
        return {
            "time": last_record.name.strftime('%Y-%m-%d %H:%M:%S'),
            "price": last_record['Close']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Route to get historical stock data for a given interval
@app.get("/stock/{ticker}/historical")
async def historical_stock_data(ticker: str, interval: str):
    try:
        data = get_stock_data(ticker, interval)
        print(f"Returning data: {data}")
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
