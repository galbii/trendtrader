import time
import psutil
import tkinter as tk
from tkinter import ttk
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import numpy as np
import yfinance as yf
import pandas as pd
import tkinter.font as tkFont
from sklearn.linear_model import LinearRegression
import matplotlib.dates as mdates

class StockApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Technical Trades")
        self.root.geometry("1200x800")
        self.root.configure(bg='#032B44')

        # Define a smaller font for ttk widgets
        small_font = tkFont.Font(family="Helvetica", size=10)

        # Style configuration for ttk widgets
        style = ttk.Style()
        style.configure("TButton", font=("Helvetica", 10))
        style.configure("TLabel", font=("Helvetica", 10))
        style.configure("TMenubutton", font=("Helvetica", 10))
        style.configure("TCheckbutton", font=("Helvetica", 10))

        # Ticker, Period, and Interval Inputs
        self.ticker_label = ttk.Label(root, text="Ticker Symbol:", style="TLabel")
        self.ticker_label.grid(row=0, column=0, padx=5, pady=5)
        self.ticker_entry = ttk.Entry(root, width=15)
        self.ticker_entry.grid(row=0, column=1, padx=5, pady=5)
        self.ticker_entry.bind("<Return>", lambda event: self.refresh_graph())

        self.period_label = ttk.Label(root, text="Time Period:", style="TLabel")
        self.period_label.grid(row=0, column=2, padx=5, pady=5)
        self.period_var = tk.StringVar()
        self.period_menu = ttk.OptionMenu(root, self.period_var, "1mo", "3mo", "6mo", "1y", "2y", "5y")
        self.period_menu.grid(row=0, column=3, padx=5, pady=5)

        self.update_interval_label = ttk.Label(root, text="Update Interval (seconds):", style="TLabel")
        self.update_interval_label.grid(row=0, column=4, padx=5, pady=5)
        self.update_interval_var = tk.StringVar()
        self.update_interval_menu = ttk.OptionMenu(root, self.update_interval_var, "60", "300", "600")
        self.update_interval_menu.grid(row=0, column=5, padx=5, pady=5)

        # Create a frame for metrics and checkboxes
        self.side_frame = ttk.Frame(root)
        self.side_frame.grid(row=0, column=6, rowspan=2, padx=5, pady=5, sticky='ns')

        # Metric labels
        self.metrics_vars = []
        metrics_labels = ["Open", "High", "Low", "Close", "Volume"]
        for label in metrics_labels:
            var = ttk.Label(self.side_frame, text=f"{label}: ", style="TLabel")
            var.pack(pady=2)
            self.metrics_vars.append(var)

        # Create a frame for checkboxes
        self.checkbox_frame = ttk.Frame(self.side_frame)
        self.checkbox_frame.pack(pady=5)

        # Indicators Label
        indicators_label = ttk.Label(self.checkbox_frame, text="Indicators", style="TLabel")
        indicators_label.pack(anchor='w')

        # Measurement Checkboxes
        self.indicator_vars = []
        indicators = [
            "RSI", 
            "SMA (20)", 
            "EMA (50)", 
            "MACD", 
            "Bollinger Bands", 
            "Stochastic Oscillator", 
            "Williams %R"
        ]
        
        self.indicator_methods = {
            "RSI": self.calculate_rsi,
            "SMA (20)": self.calculate_sma,
            "EMA (50)": self.calculate_ema,
            "MACD": self.calculate_macd,
            "Bollinger Bands": self.calculate_bollinger_bands,
            "Stochastic Oscillator": self.calculate_stochastic_oscillator,
            "Williams %R": self.calculate_williams_r,
        }
        
        for indicator in indicators:
            var = tk.BooleanVar()
            checkbox = ttk.Checkbutton(self.checkbox_frame, text=indicator, variable=var, style="TCheckbutton", command=self.refresh_graph)
            checkbox.pack(anchor='w')
            self.indicator_vars.append((var, indicator))

        # Buy/Sell Signals Label
        self.signals_label = ttk.Label(self.checkbox_frame, text="Buy/Sell Signals", style="TLabel")
        self.signals_label.pack(anchor='w')

        # Buy/Sell Signal Checkboxes
        self.signal_vars = []
        self.signals = ["Simple Buy Signal", "Simple Sell Signal", "Crossing SMA", "RSI Buy/Sell", "MACD Buy/Sell"]
        for signal in self.signals:
            var = tk.BooleanVar()
            checkbox = ttk.Checkbutton(self.checkbox_frame, text=signal, variable=var, style="TCheckbutton", command=self.refresh_graph)
            checkbox.pack(anchor='w')
            self.signal_vars.append((var, signal))

        # Refresh Button
        self.refresh_button = ttk.Button(root, text="Refresh", command=self.refresh_graph, style="TButton")
        self.refresh_button.grid(row=0, column=7, padx=5, pady=10)

        # Linear Regression Button
        self.regression_button = ttk.Button(self.side_frame, text="Linear Regression", command=self.plot_linear_regression, style="TButton")
        self.regression_button.pack(pady=10)

        # Create matplotlib figure and canvas for the graph
        self.fig, self.ax1 = plt.subplots(figsize=(10, 4))
        self.canvas = FigureCanvasTkAgg(self.fig, master=root)
        self.canvas_widget = self.canvas.get_tk_widget()
        self.canvas_widget.grid(row=1, column=0, columnspan=6, padx=10, pady=10, sticky='nsew')

        # Configure row and column weights for scaling
        root.grid_rowconfigure(0, weight=0)
        root.grid_rowconfigure(1, weight=1)
        root.grid_columnconfigure(0, weight=5)
        root.grid_columnconfigure(6, weight=0)
        root.grid_columnconfigure(7, weight=0)

        # Initialize the default graph
        self.initialize_default_graph()

    def initialize_default_graph(self):
        """ Initialize the graph with default values. """
        data = pd.DataFrame({
            'Close': [100, 102, 101, 105, 103],
            'Open': [99, 100, 102, 101, 104],
            'High': [101, 104, 103, 106, 105],
            'Low': [98, 99, 100, 102, 101],
            'Volume': [1000, 1500, 2000, 1200, 1300]
        }, index=pd.date_range(start='2024-01-01', periods=5))

        self.create_graph(data, 'Technical Trades')

    def refresh_graph(self):
        """ Refresh the graph based on the current input and selected indicators. """
        ticker = self.ticker_entry.get().strip().upper()

        if ticker:
            start_time = time.time()
            initial_cpu = psutil.cpu_percent()
            initial_memory = psutil.virtual_memory().percent
            # Fetch stock data
            try:
                data = yf.download(ticker, period=self.period_var.get(), interval='1d')
                if data.empty:
                    print("No data found for this ticker.")
                    return
                self.update_metrics(data)
                self.create_graph(data, ticker)
            except Exception as e:
                print(f"Error fetching data: {e}")
            end_time = time.time()
            final_cpu = psutil.cpu_percent()
            final_memory = psutil.virtual_memory().percent

            print(f"Time taken to refresh graph: {end_time - start_time:.2f} seconds")
            print(f"CPU usage before: {initial_cpu}%, after: {final_cpu}%")
            print(f"Memory usage before: {initial_memory}%, after: {final_memory}%")

    def update_metrics(self, data):
        """ Update the displayed metrics based on the fetched data. """
        metrics = {
            "Open": data['Open'].iloc[-1],
            "High": data['High'].iloc[-1],
            "Low": data['Low'].iloc[-1],
            "Close": data['Close'].iloc[-1],
            "Volume": data['Volume'].iloc[-1],
        }

        for var, (label, value) in zip(self.metrics_vars, metrics.items()):
            var.config(text=f"{label}: {value:.2f}")

    def create_graph(self, data, ticker):
        """ Create the graph with the fetched data and selected indicators. """
        self.ax1.clear()

        # Set background colors
        self.fig.patch.set_facecolor('#032B44')
        self.ax1.set_facecolor('#032B44')

        # Plot closing price
        self.ax1.plot(data.index, data['Close'], color='cyan', label='Close Price', linewidth=2)

        # Plot indicators if checked
        for var, indicator in self.indicator_vars:
            if var.get():
                if indicator in self.indicator_methods:
                    self.indicator_methods[indicator](data)

        # Plot buy/sell signals if checked
        for var, signal in self.signal_vars:
            if var.get():
                self.plot_signal(data, signal)

        # Set title and labels
        self.ax1.set_title(f"{ticker} Price", color='white')
        self.ax1.set_ylabel("Price", color='white')
        self.ax1.set_xlabel("Date", color='white')

        # Improve date formatting to avoid cutoff
        self.ax1.xaxis.set_major_locator(mdates.AutoDateLocator())
        self.ax1.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
        self.fig.autofmt_xdate(rotation=45)

        # Add gridlines and adjust aesthetics
        self.ax1.grid(True, linestyle='--', alpha=0.6)
        self.ax1.spines['top'].set_visible(False)
        self.ax1.spines['right'].set_visible(False)
        self.ax1.spines['left'].set_color('white')
        self.ax1.spines['bottom'].set_color('white')
        self.ax1.tick_params(axis='x', colors='white')
        self.ax1.tick_params(axis='y', colors='white')

        self.canvas.draw()


    def log_calculations(self):
        """ Log the summary of calculations performed, including details. """
        calculations_summary = []

        # Log selected indicators with details
        for var, indicator in self.indicator_vars:
            if var.get():
                if indicator == "RSI":
                    rsi_value = self.calculate_rsi(data)  # Assuming calculate_rsi returns the value
                    calculations_summary.append(f"Calculated {indicator}: RSI = {rsi_value:.2f}")
                elif indicator == "SMA (20)":
                    sma_value = self.calculate_sma(data)  # Assuming calculate_sma returns the value
                    calculations_summary.append(f"Calculated {indicator}: SMA(20) = {sma_value:.2f}")
                elif indicator == "EMA (50)":
                    ema_value = self.calculate_ema(data)  # Assuming calculate_ema returns the value
                    calculations_summary.append(f"Calculated {indicator}: EMA(50) = {ema_value:.2f}")
                # Add similar logic for other indicators

        # Log selected signals with details
        for var, signal in self.signal_vars:
            if var.get():
                calculations_summary.append(f"Triggered {signal}")

        print("\n".join(calculations_summary) if calculations_summary else "No calculations performed.")

    def plot_signal(self, data, signal):
        """ Plot the specified buy/sell signal on the graph. """
        if signal == "Simple Buy Signal":
            buy_signals = np.where(data['Close'] > data['Close'].shift(1), data['Close'], np.nan)
            self.ax1.scatter(data.index, buy_signals, marker='^', color='green', label='Buy', zorder=5)
        elif signal == "Simple Sell Signal":
            sell_signals = np.where(data['Close'] < data['Close'].shift(1), data['Close'], np.nan)
            self.ax1.scatter(data.index, sell_signals, marker='v', color='red', label='Sell', zorder=5)
        elif signal == "Crossing SMA":
            sma = data['Close'].rolling(window=20).mean()
            buy_signals = np.where((data['Close'] > sma) & (data['Close'].shift(1) < sma.shift(1)), data['Close'], np.nan)
            sell_signals = np.where((data['Close'] < sma) & (data['Close'].shift(1) > sma.shift(1)), data['Close'], np.nan)
            self.ax1.scatter(data.index, buy_signals, marker='^', color='green', label='Buy', zorder=5)
            self.ax1.scatter(data.index, sell_signals, marker='v', color='red', label='Sell', zorder=5)
        elif signal == "RSI Buy/Sell":
            rsi = self.calculate_rsi(data)
            buy_signals = np.where(rsi < 30, data['Close'], np.nan)
            sell_signals = np.where(rsi > 70, data['Close'], np.nan)
            self.ax1.scatter(data.index, buy_signals, marker='^', color='green', label='Buy', zorder=5)
            self.ax1.scatter(data.index, sell_signals, marker='v', color='red', label='Sell', zorder=5)
        elif signal == "MACD Buy/Sell":
            macd, signal_line = self.calculate_macd(data)
            buy_signals = np.where((macd > signal_line) & (macd.shift(1) < signal_line.shift(1)), data['Close'], np.nan)
            sell_signals = np.where((macd < signal_line) & (macd.shift(1) > signal_line.shift(1)), data['Close'], np.nan)
            self.ax1.scatter(data.index, buy_signals, marker='^', color='green', label='Buy', zorder=5)
            self.ax1.scatter(data.index, sell_signals, marker='v', color='red', label='Sell', zorder=5)
    
    def calculate_rsi(self, data):
        """ Calculate and plot the RSI indicator. """
        delta = data['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))

        self.ax1.plot(data.index, rsi, label='RSI', color='purple')
        return rsi

    def calculate_sma(self, data):
        """ Calculate and plot the SMA indicator. """
        sma = data['Close'].rolling(window=20).mean()
        self.ax1.plot(data.index, sma, label='SMA (20)', color='orange')
        return sma

    def calculate_ema(self, data):
        """ Calculate and plot the EMA indicator. """
        ema = data['Close'].ewm(span=50, adjust=False).mean()
        self.ax1.plot(data.index, ema, label='EMA (50)', color='green')
        return ema

    def calculate_macd(self, data):
        """ Calculate and plot the MACD indicator. """
        exp1 = data['Close'].ewm(span=12, adjust=False).mean()
        exp2 = data['Close'].ewm(span=26, adjust=False).mean()
        macd = exp1 - exp2
        signal = macd.ewm(span=9, adjust=False).mean()
        self.ax1.plot(data.index, macd, label='MACD', color='blue')
        self.ax1.plot(data.index, signal, label='Signal', color='red')
        return macd

    def calculate_bollinger_bands(self, data):
        """ Calculate and plot Bollinger Bands. """
        sma = data['Close'].rolling(window=20).mean()
        std = data['Close'].rolling(window=20).std()
        upper_band = sma + (std * 2)
        lower_band = sma - (std * 2)
        self.ax1.plot(data.index, upper_band, label='Upper Band', color='green', linestyle='--')
        self.ax1.plot(data.index, lower_band, label='Lower Band', color='red', linestyle='--')
        return None

    def calculate_stochastic_oscillator(self, data):
        """ Calculate and plot the Stochastic Oscillator. """
        low_min = data['Low'].rolling(window=14).min()
        high_max = data['High'].rolling(window=14).max()
        stoch = 100 * ((data['Close'] - low_min) / (high_max - low_min))
        self.ax1.plot(data.index, stoch, label='Stochastic Oscillator', color='orange')
        return stoch

    def calculate_williams_r(self, data):
        """ Calculate and plot Williams %R. """
        high_max = data['High'].rolling(window=14).max()
        low_min = data['Low'].rolling(window=14).min()
        williams_r = -100 * ((high_max - data['Close']) / (high_max - low_min))
        self.ax1.plot(data.index, williams_r, label='Williams %R', color='purple')
        return williams_r

    def plot_linear_regression(self):
        """ Plot linear regression line on the graph. """
        ticker = self.ticker_entry.get().strip().upper()
        data = yf.download(ticker, period=self.period_var.get(), interval='1d')
        
        if data.empty:
            print("No data found for linear regression.")
            return

        X = np.arange(len(data)).reshape(-1, 1)  # Reshape for sklearn
        y = data['Close'].values
        model = LinearRegression().fit(X, y)
        predictions = model.predict(X)
        self.ax1.plot(data.index, predictions, label='Linear Regression', color='yellow', linestyle='--')

        # Refresh graph to show linear regression
        self.canvas.draw()

if __name__ == "__main__":
    root = tk.Tk()
    app = StockApp(root)
    root.mainloop()
