import yfinance as yf
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Model, Sequential
from tensorflow.keras.layers import LSTM, GRU, Dense, Dropout, Input, Concatenate, Attention
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.metrics import accuracy_score
import matplotlib.pyplot as plt

def get_stock_data(ticker):
    stock_data = yf.download(ticker)
    stock_data['12_day_ema'] = stock_data['Close'].ewm(span=12, min_periods=12).mean()
    stock_data['26_day_ema'] = stock_data['Close'].ewm(span=26, min_periods=26).mean()
    stock_data['MACD'] = stock_data['12_day_ema'] - stock_data['26_day_ema']
    stock_data['MACD_signal'] = stock_data['MACD'].ewm(span=9, min_periods=9).mean()
    delta = stock_data['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    stock_data['RSI'] = 100 - (100 / (1 + rs))
    stock_data['Volume Profile'] = (stock_data['Volume'] - stock_data['Volume'].min()) / (stock_data['Volume'].max() - stock_data['Volume'].min())
    stock_data['50_day_ma'] = stock_data['Close'].rolling(window=50).mean()
    stock_data['200_day_ma'] = stock_data['Close'].rolling(window=200).mean()
    stock_data['20_day_sma'] = stock_data['Close'].rolling(window=20).mean()
    stock_data['stddev'] = stock_data['Close'].rolling(window=20).std()
    stock_data['Upper_BB'] = stock_data['20_day_sma'] + (stock_data['stddev'] * 2)
    stock_data['Lower_BB'] = stock_data['20_day_sma'] - (stock_data['stddev'] * 2)
    stock_data['Stochastic Oscillator'] = ((stock_data['Close'] - stock_data['Low'].rolling(window=14).min()) /
                                          (stock_data['High'].rolling(window=14).max() - stock_data['Low'].rolling(window=14).min())) * 100
    stock_data['Williams %R'] = ((stock_data['High'].rolling(window=14).max() - stock_data['Close']) /
                                 (stock_data['High'].rolling(window=14).max() - stock_data['Low'].rolling(window=14).min())) * -100
    stock_data.dropna(inplace=True)
    
    return stock_data

def label_trends(stock_data):
    stock_data['Trend'] = 0  # Default to no trend
    
    # Define weights
    weights = {
        'MA': 0.4,  # Weight for moving averages
        'RSI': 0.3, # Weight for RSI
        'MACD': 0.3 # Weight for MACD
    }
    
    # Moving Average Crossover
    ma_trend = np.where(stock_data['50_day_ma'] > stock_data['200_day_ma'], 1, -1) * weights['MA']
    
    # RSI Threshold
    rsi_trend = np.where(stock_data['RSI'] > 50, 1, -1) * weights['RSI']
    
    # MACD Line above Signal Line
    macd_trend = np.where(stock_data['MACD'] > stock_data['MACD_signal'], 1, -1) * weights['MACD']
    
    # Calculate weighted sum
    stock_data['Weighted_Trend'] = ma_trend + rsi_trend + macd_trend
    
    # Determine final trend based on weighted sum
    stock_data['Trend'] = np.where(stock_data['Weighted_Trend'] > 0, 1, -1)
    
    # Drop temporary columns
    stock_data = stock_data.drop(columns=['Weighted_Trend'])
    
    return stock_data

def preprocess_data(stock_data):
    features = ['Open', 'High', 'Low', 'Close', 'Volume', '12_day_ema', '26_day_ema', 'MACD', 'MACD_signal', 
                'RSI', 'Volume Profile', '50_day_ma', '200_day_ma', 'Upper_BB', 'Lower_BB', 
                'Stochastic Oscillator', 'Williams %R']
    data = stock_data[features].values
    target = stock_data['Trend'].values

    scaler = MinMaxScaler(feature_range=(0, 1))
    scaler.fit(data)
    data_scaled = scaler.transform(data)

    sequence_length = 30
    X, y = [], []
    for i in range(len(data_scaled) - sequence_length):
        X.append(data_scaled[i:i+sequence_length])
        y.append(target[i+sequence_length])

    X, y = np.array(X), np.array(y)
    return X, y, scaler

def build_model(input_shape):
    inputs = Input(shape=input_shape)
    x = LSTM(units=64, return_sequences=True)(inputs)
    x = Dropout(0.2)(x)
    x = LSTM(units=64, return_sequences=True)(x)
    x = Dropout(0.2)(x)
    x = LSTM(units=32, return_sequences=True)(x)
    x = Dropout(0.2)(x)
    
    attention = Attention()([x, x])
    x = Concatenate()([x, attention])
    
    x = LSTM(units=32)(x)
    x = Dropout(0.2)(x)
    outputs = Dense(units=1, activation='sigmoid')(x)
    
    model = Model(inputs=inputs, outputs=outputs)
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model

def backtest_strategy(stock_data, model, scaler, initial_balance=500):
    features = ['Open', 'High', 'Low', 'Close', 'Volume', '12_day_ema', '26_day_ema', 'MACD', 'MACD_signal', 
                'RSI', 'Volume Profile', '50_day_ma', '200_day_ma', 'Upper_BB', 'Lower_BB', 
                'Stochastic Oscillator', 'Williams %R']
    sequence_length = 30
    balance = initial_balance
    shares = 0
    portfolio_value = []
    trades = []

    uptrend_count = 0
    downtrend_count = 0
    holding = False

    for i in range(sequence_length, len(stock_data)):
        last_30_days = stock_data[i-sequence_length:i]
        last_30_days_scaled = scaler.transform(last_30_days[features])
        X_pred = last_30_days_scaled.reshape(1, sequence_length, len(features))
        next_day_trend = model.predict(X_pred)
        next_day_trend = (next_day_trend > 0.5).astype(int).flatten()[0]

        actual_trend = stock_data.iloc[i]['Trend']

        if next_day_trend == 1:
            uptrend_count += 1
            downtrend_count = 0
        else:
            downtrend_count += 1
            uptrend_count = 0

        action = "Hold"
        if not holding and uptrend_count == 2:
            shares += balance // stock_data.iloc[i]['Close']
            balance -= shares * stock_data.iloc[i]['Close']
            holding = True
            action = "Buy"
        elif holding and downtrend_count == 2:
            balance += shares * stock_data.iloc[i]['Close']
            shares = 0
            holding = False
            action = "Sell"

        current_portfolio_value = balance + shares * stock_data.iloc[i]['Close']
        portfolio_value.append(current_portfolio_value)

        trades.append([stock_data.index[i], "Uptrend" if next_day_trend == 1 else "Downtrend", 
                       "Uptrend" if actual_trend == 1 else "Downtrend", action, shares, 
                       round(balance, 2), round(current_portfolio_value, 2), stock_data.iloc[i]['Adj Close']])

    trades_df = pd.DataFrame(trades, columns=["Date", "Model Prediction", "Actual Trend", "Action", "Shares", "Balance", "Portfolio Value", "Adj Close"])
    return portfolio_value, trades_df

def run_analysis(tickers):
    with open("analysis.txt", "w") as f:
        for ticker in tickers:
            print(f"Processing {ticker}...")
            stock_df = get_stock_data(ticker)
            if stock_df is not None:
                stock_df = label_trends(stock_df)

                # Set aside the last 90 entries for backtesting
                train_df = stock_df[:-90]
                test_df = stock_df[-90:]

                X_train, y_train, scaler = preprocess_data(train_df)

                model = build_model((X_train.shape[1], X_train.shape[2]))
                early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
                model.fit(X_train, y_train, epochs=50, batch_size=32, validation_split=0.1, callbacks=[early_stopping])

                portfolio_value, trades_df = backtest_strategy(test_df, model, scaler)
                
                final_balance = portfolio_value[-1]
                y_test = test_df['Trend'].values[-60:]
                X_test, _, _ = preprocess_data(test_df)
                y_pred = (model.predict(X_test) > 0.5).astype(int)
                y_pred = y_pred[-60:].flatten()
                accuracy = accuracy_score(y_test, y_pred)

                f.write(f"Stock: {ticker}\n")
                f.write(f"Final portfolio value: ${final_balance:.2f}\n")
                f.write(f"Model accuracy: {accuracy:.2f}\n")
                f.write(trades_df.to_string())
                f.write("\n\n")

                trades_df.to_csv(f"{ticker}_trades.csv", index=False)
                print(f"Trade log for {ticker} has been saved to {ticker}_trades.csv")

tickers = ["AAPL", "GOOGL", "AMZN", "CMG", "MSFT", "TSLA", "NVDA", "INTC", "META"]  # Example list of tickers
#tickers = ["NVDA"]
run_analysis(tickers)
