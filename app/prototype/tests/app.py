
import tkinter as tk
from tkinter import ttk
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import numpy as np
import yfinance as yf
import pandas as pd
import tkinter.font as tkFont


class StockApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Trend Trader")
        self.root.geometry("1200x800")  # Increased initial window size
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
        self.side_frame.grid(row=0, column=6, rowspan=2, padx=5, pady=5, sticky='ns')  # Allows vertical stretching

        # Metric labels
        self.metrics_vars = []
        metrics_labels = ["Open", "High", "Low", "Close", "Volume"]
        for label in metrics_labels:
            var = ttk.Label(self.side_frame, text=f"{label}: ", style="TLabel")
            var.pack(pady=2)  # Use pack for a more compact layout
            self.metrics_vars.append(var)

        # Create a frame for checkboxes
        self.checkbox_frame = ttk.Frame(self.side_frame)
        self.checkbox_frame.pack(pady=5)  # Use pack here as well for better layout

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

        # Create matplotlib figure and canvas for the graph
        self.fig, self.ax1 = plt.subplots(figsize=(10, 4))
        self.canvas = FigureCanvasTkAgg(self.fig, master=root)
        self.canvas_widget = self.canvas.get_tk_widget()
        self.canvas_widget.grid(row=1, column=0, columnspan=6, padx=10, pady=10, sticky='nsew')

        # Configure row and column weights for scaling
        root.grid_rowconfigure(0, weight=0)  # Input section will not grow
        root.grid_rowconfigure(1, weight=1)  # Graph will grow
        root.grid_columnconfigure(0, weight=5)  # Graph column gets more weight
        root.grid_columnconfigure(1, weight=0)  # Empty column
        root.grid_columnconfigure(2, weight=0)  # Empty column
        root.grid_columnconfigure(3, weight=0)  # Empty column
        root.grid_columnconfigure(4, weight=0)  # Empty column
        root.grid_columnconfigure(5, weight=0)  # Empty column
        root.grid_columnconfigure(6, weight=0)  # Side frame (metrics and checkboxes)
        root.grid_columnconfigure(7, weight=0)  # Refresh button column

        # Initialize the default graph
        self.initialize_default_graph()

    def initialize_default_graph(self):
        """ Initialize the graph with default values. """
        # Example data; you may replace it with actual data fetching
        data = pd.DataFrame({
            'Close': [100, 102, 101, 105, 103],
            'Open': [99, 100, 102, 101, 104],
            'High': [101, 104, 103, 106, 105],
            'Low': [98, 99, 100, 102, 101],
            'Volume': [1000, 1500, 2000, 1200, 1300]
        }, index=pd.date_range(start='2024-01-01', periods=5))

        self.create_graph(data, 'AAPL')

    def refresh_graph(self):
        """ Refresh the graph based on the current input and selected indicators. """
        ticker = self.ticker_entry.get().strip().upper()

        if ticker:
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
        # Clear previous plots
        self.ax1.clear()

        # Set background colors
        self.fig.patch.set_facecolor('#032B44')  # Navy blue
        self.ax1.set_facecolor('#87CEEB')  # Pastel blue

        # Plot stock price
        self.ax1.plot(data.index, data['Close'], color='white', label='Close Price', linewidth=0.75)
        self.ax1.set_title(f"{ticker} Stock Price", color='white', fontsize=8)
        self.ax1.set_xlabel('Date', color='white', fontsize=8)
        self.ax1.set_ylabel('Price ($)', color='white', fontsize=8)
        self.ax1.tick_params(axis='both', colors='white')
        self.ax1.xaxis.label.set_size(8)
        self.ax1.yaxis.label.set_size(8)

        # Adjust date formatting and tick parameters for better legibility
        self.ax1.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: pd.to_datetime(x).strftime('%Y-%m-%d')))
        self.ax1.tick_params(axis='x', labelsize=6)  # Smaller x-axis labels
        self.ax1.tick_params(axis='y', labelsize=8)  # y-axis labels

        # Loop through indicators and plot them
        for var, indicator in self.indicator_vars:
            if var.get():
                if indicator == "RSI":
                    rsi = self.calculate_rsi(data)
                    self.ax1.plot(data.index, rsi, label='RSI', linewidth=0.75)
                elif indicator == "SMA (20)":
                    sma = self.calculate_sma(data)
                    self.ax1.plot(data.index, sma, label='SMA (20)', linewidth=0.75)
                elif indicator == "EMA (50)":
                    ema = self.calculate_ema(data)
                    self.ax1.plot(data.index, ema, label='EMA (50)', linewidth=0.75)
                elif indicator == "MACD":
                    macd, signal = self.calculate_macd(data)
                    self.ax1.plot(data.index, macd, label='MACD', linewidth=0.75)
                    self.ax1.plot(data.index, signal, label='Signal Line', linewidth=0.75)
                elif indicator == "Bollinger Bands":
                    upper_band, lower_band = self.calculate_bollinger_bands(data)
                    self.ax1.plot(data.index, upper_band, label='Upper Band', linewidth=0.75, color='green')
                    self.ax1.plot(data.index, lower_band, label='Lower Band', linewidth=0.75, color='red')
                elif indicator == "Stochastic Oscillator":
                    stoch_k, stoch_d = self.calculate_stochastic_oscillator(data)
                    self.ax1.plot(data.index, stoch_k, label='Stochastic %K', linewidth=0.75)
                    self.ax1.plot(data.index, stoch_d, label='Stochastic %D', linewidth=0.75)
                elif indicator == "Williams %R":
                    williams_r = self.calculate_williams_r(data)
                    self.ax1.plot(data.index, williams_r, label='Williams %R', linewidth=0.75)

        # Add a text annotation for the current price
        current_price = data['Close'].iloc[-1]
        self.ax1.annotate(f'${current_price:.2f}', 
                          xy=(data.index[-1], current_price), 
                          xytext=(data.index[-1], current_price + 5),
                          arrowprops=dict(facecolor='black', shrink=0.05),
                          fontsize=7, color='black', weight='bold')

        # Process and display buy/sell signals
        for var, signal in self.signal_vars:
            if var.get():
                self.plot_signals(data, signal)

        # Add a legend with smaller font
        self.ax1.legend(fontsize=7)

        # Refresh the canvas
        self.canvas.draw()

    def plot_signals(self, data, signal_type):
        """ Plot buy/sell signals based on selected indicators. """
        if signal_type == "Simple Buy Signal":
            # Example buy signal logic: buy when current price is higher than previous close
            buy_signals = (data['Close'].diff() > 0) & (data['Close'] > data['Open'])
            self.ax1.plot(data.index[buy_signals], data['Close'][buy_signals], '^', markersize=8, color='g', label='Buy Signal')

        elif signal_type == "Simple Sell Signal":
            # Example sell signal logic: sell when current price is lower than previous close
            sell_signals = (data['Close'].diff() < 0) & (data['Close'] < data['Open'])
            self.ax1.plot(data.index[sell_signals], data['Close'][sell_signals], 'v', markersize=8, color='r', label='Sell Signal')

        elif signal_type == "Crossing SMA":
            # Implement your logic for crossing SMA signals here
            sma = self.calculate_sma(data)
            cross_above = (data['Close'] > sma) & (data['Close'].shift(1) <= sma.shift(1))
            cross_below = (data['Close'] < sma) & (data['Close'].shift(1) >= sma.shift(1))
            self.ax1.plot(data.index[cross_above], data['Close'][cross_above], '^', markersize=8, color='g', label='Cross Above SMA')
            self.ax1.plot(data.index[cross_below], data['Close'][cross_below], 'v', markersize=8, color='r', label='Cross Below SMA')

        elif signal_type == "RSI Buy/Sell":
            rsi = self.calculate_rsi(data)
            buy_signals = (rsi < 30)
            sell_signals = (rsi > 70)
            self.ax1.plot(data.index[buy_signals], data['Close'][buy_signals], '^', markersize=8, color='g', label='RSI Buy Signal')
            self.ax1.plot(data.index[sell_signals], data['Close'][sell_signals], 'v', markersize=8, color='r', label='RSI Sell Signal')

        elif signal_type == "MACD Buy/Sell":
            macd, signal_line = self.calculate_macd(data)
            buy_signals = (macd > signal_line) & (macd.shift(1) <= signal_line.shift(1))
            sell_signals = (macd < signal_line) & (macd.shift(1) >= signal_line.shift(1))
            self.ax1.plot(data.index[buy_signals], data['Close'][buy_signals], '^', markersize=8, color='g', label='MACD Buy Signal')
            self.ax1.plot(data.index[sell_signals], data['Close'][sell_signals], 'v', markersize=8, color='r', label='MACD Sell Signal')

    def calculate_rsi(self, data, period=14):
        """ Calculate the RSI for the given data. """
        delta = data['Close'].diff(1)
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        rsi = rsi.fillna(0)  # Fill NaN values

        return rsi

    def calculate_sma(self, data, period=20):
        """ Calculate the Simple Moving Average (SMA). """
        sma = data['Close'].rolling(window=period).mean()
        return sma.fillna(0)  # Fill NaN values

    def calculate_ema(self, data, period=50):
        """ Calculate the Exponential Moving Average (EMA). """
        ema = data['Close'].ewm(span=period, adjust=False).mean()
        return ema.fillna(0)  # Fill NaN values

    def calculate_macd(self, data, short_window=12, long_window=26, signal_window=9):
        """ Calculate the MACD (Moving Average Convergence Divergence). """
        short_ema = data['Close'].ewm(span=short_window, adjust=False).mean()
        long_ema = data['Close'].ewm(span=long_window, adjust=False).mean()
        macd = short_ema - long_ema
        signal = macd.ewm(span=signal_window, adjust=False).mean()
        return macd.fillna(0), signal.fillna(0)

    def calculate_bollinger_bands(self, data, period=20, num_std=2):
        """ Calculate Bollinger Bands. """
        sma = self.calculate_sma(data, period)
        std = data['Close'].rolling(window=period).std()
        upper_band = sma + (std * num_std)
        lower_band = sma - (std * num_std)
        return upper_band.fillna(0), lower_band.fillna(0)

    def calculate_stochastic_oscillator(self, data, period=14):
        """ Calculate the Stochastic Oscillator. """
        min_low = data['Low'].rolling(window=period).min()
        max_high = data['High'].rolling(window=period).max()
        stoch_k = 100 * (data['Close'] - min_low) / (max_high - min_low)
        stoch_d = stoch_k.rolling(window=3).mean()
        return stoch_k.fillna(0), stoch_d.fillna(0)

    def calculate_williams_r(self, data, period=14):
        """ Calculate Williams %R. """
        max_high = data['High'].rolling(window=period).max()
        min_low = data['Low'].rolling(window=period).min()
        williams_r = -100 * (max_high - data['Close']) / (max_high - min_low)
        return williams_r.fillna(0)

# Main Loop
if __name__ == "__main__":
    root = tk.Tk()
    app = StockApp(root)
    root.mainloop()
