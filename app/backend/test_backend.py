
import pytest
from fastapi.testclient import TestClient
from main import app  # Import your FastAPI app from the main file

client = TestClient(app)

# Test stock price prediction function
def test_predict_stock_price():
    # Mock input data: last 5 prices
    prices = [150, 152, 154, 156, 158]
    predicted_prices = predict_stock_price(prices, 3)

    # Check the type and length of the predicted prices
    assert isinstance(predicted_prices, list)
    assert len(predicted_prices) == 3
    assert predicted_prices[0] > prices[-1]  # Ensure predicted price is greater than the last known price (linear growth)

# Test the /stock-data endpoint
def test_get_stock_data():
    # Test valid stock data request
    response = client.get("/stock-data", params={"ticker": "AAPL", "interval": "1m", "range": "1d"})
    assert response.status_code == 200
    data = response.json()
    assert "timestamps" in data
    assert "prices" in data
    assert len(data["timestamps"]) > 0
    assert len(data["prices"]) > 0

    # Test invalid ticker (404 error)
    response = client.get("/stock-data", params={"ticker": "INVALID", "interval": "1m", "range": "1d"})
    assert response.status_code == 404
    assert response.json() == {"detail": "No data found for the given parameters"}

# Test the /log-trade endpoint
def test_log_trade():
    trade_data = {
        "ticker": "AAPL",
        "price": 150,
        "time": "2024-12-10T14:45",
        "status": "open"
    }

    response = client.post("/log-trade", json=trade_data)
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["message"] == "Trade logged successfully"
    assert response_data["trade"] == trade_data

    # Test the /trade-log endpoint
    response = client.get("/trade-log")
    assert response.status_code == 200
    trade_log = response.json()["trade_log"]
    assert len(trade_log) > 0
    assert trade_log[-1] == trade_data

# Test the /update-trade endpoint
def test_update_trade():
    trade_data = {
        "ticker": "AAPL",
        "price": 150,
        "time": "2024-12-10T14:45",
        "status": "open"
    }
    
    # Log a trade first
    client.post("/log-trade", json=trade_data)
    
    # Update the trade
    updated_trade_data = {"price": 155, "status": "closed"}
    response = client.put("/update-trade/0", json=updated_trade_data)
    assert response.status_code == 200
    updated_trade = response.json()["trade"]
    assert updated_trade["price"] == 155
    assert updated_trade["status"] == "closed"

# Test the /opt-out-trade endpoint
def test_opt_out_trade():
    trade_data = {
        "ticker": "AAPL",
        "price": 150,
        "time": "2024-12-10T14:45",
        "status": "open"
    }
    
    # Log a trade first
    client.post("/log-trade", json=trade_data)

    # Remove the trade
    response = client.delete("/opt-out-trade/0")
    assert response.status_code == 200
    assert response.json()["message"] == "Trade removed"

    # Check the trade log is empty
    response = client.get("/trade-log")
    assert len(response.json()["trade_log"]) == 0
