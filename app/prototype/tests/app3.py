import tkinter.font as tkFont
import yfinance as yf
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import tkinter as tk
from tkinter import ttk, messagebox
import threading
import time
import numpy as np
from sklearn.linear_model import LinearRegression

class StockApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Live Stock Data")
        self.root.geometry("1200x800")
        self.root.configure(bg='#032B44')  # Navy blue background

        # Create input fields
        self.ticker_label = ttk.Label(root, text="Ticker Symbol:", background='#032B44', foreground='white')
        self.ticker_label.grid(row=0, column=0, padx=10, pady=5, sticky='w')
        self.ticker_entry = ttk.Entry(root, width=20)
        self.ticker_entry.grid(row=0, column=1, padx=10, pady=5)

        self.period_label = ttk.Label(root, text="Time Period:", background='#032B44', foreground='white')
        self.period_label.grid(row=1, column=0, padx=10, pady=5, sticky='w')
        self.period_var = tk.StringVar()
        self.period_var.set("1mo")  # default value
        self.period_menu = ttk.OptionMenu(root, self.period_var, "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max")
        self.period_menu.grid(row=1, column=1, padx=10, pady=5)

        self.update_interval_label = ttk.Label(root, text="Update Interval (seconds):", background='#032B44', foreground='white')
        self.update_interval_label.grid(row=2, column=0, padx=10, pady=5, sticky='w')
        self.update_interval_var = tk.StringVar()
        self.update_interval_var.set("60")
        self.update_interval_menu = ttk.OptionMenu(root, self.update_interval_var, "60", "300", "600")
        self.update_interval_menu.grid(row=2, column=1, padx=10, pady=5)

        # Create measurement section (3x3 grid)
        self.indicator_frame = tk.LabelFrame(root, text="Indicators", background='#032B44', foreground='white')
        self.indicator_frame.grid(row=3, column=0, padx=10, pady=5, sticky='w')

        self.rsi_var = tk.BooleanVar()
        self.sma_var = tk.BooleanVar()
        self.ema_var = tk.BooleanVar()
        self.bollinger_var = tk.BooleanVar()
        self.stochastic_var = tk.BooleanVar()
        self.williams_var = tk.BooleanVar()
        self.macd_var = tk.BooleanVar()

        self.rsi_check = ttk.Checkbutton(self.indicator_frame, text="RSI", variable=self.rsi_var)
        self.sma_check = ttk.Checkbutton(self.indicator_frame, text="SMA (20)", variable=self.sma_var)
        self.ema_check = ttk.Checkbutton(self.indicator_frame, text="EMA (20)", variable=self.ema_var)
        self.bollinger_check = ttk.Checkbutton(self.indicator_frame, text="Bollinger Bands", variable=self.bollinger_var)
        self.stochastic_check = ttk.Checkbutton(self.indicator_frame, text="Stochastic", variable=self.stochastic_var)
        self.williams_check = ttk.Checkbutton(self.indicator_frame, text="Williams %R", variable=self.williams_var)
        self.macd_check = ttk.Checkbutton(self.indicator_frame, text="MACD", variable=self.macd_var)

        # Arrange in grid
        self.rsi_check.grid(row=0, column=0, padx=10, pady=5, sticky='w')
        self.sma_check.grid(row=0, column=1, padx=10, pady=5, sticky='w')
        self.ema_check.grid(row=0, column=2, padx=10, pady=5, sticky='w')
        self.bollinger_check.grid(row=1, column=0, padx=10, pady=5, sticky='w')
        self.stochastic_check.grid(row=1, column=1, padx=10, pady=5, sticky='w')
        self.williams_check.grid(row=1, column=2, padx=10, pady=5, sticky='w')
        self.macd_check.grid(row=2, column=0, padx=10, pady=5, sticky='w')

        # Create Buy/Sell signal section
        self.signal_frame = tk.LabelFrame(root, text="Buy/Sell Signals", background='#032B44', foreground='white')
        self.signal_frame.grid(row=3, column=1, padx=10, pady=5, sticky='w')

        self.rsi_signal_var = tk.BooleanVar()
        self.macd_signal_var = tk.BooleanVar()
        self.bollinger_signal_var = tk.BooleanVar()
        self.stochastic_signal_var = tk.BooleanVar()

        self.rsi_signal_check = ttk.Checkbutton(self.signal_frame, text="RSI Buy/Sell", variable=self.rsi_signal_var)
        self.macd_signal_check = ttk.Checkbutton(self.signal_frame, text="MACD Buy/Sell", variable=self.macd_signal_var)
        self.bollinger_signal_check = ttk.Checkbutton(self.signal_frame, text="Bollinger Buy/Sell", variable=self.bollinger_signal_var)
        self.stochastic_signal_check = ttk.Checkbutton(self.signal_frame, text="Stochastic Buy/Sell", variable=self.stochastic_signal_var)

        # Arrange in grid
        self.rsi_signal_check.grid(row=0, column=0, padx=10, pady=5, sticky='w')
        self.macd_signal_check.grid(row=0, column=1, padx=10, pady=5, sticky='w')
        self.bollinger_signal_check.grid(row=1, column=0, padx=10, pady=5, sticky='w')
        self.stochastic_signal_check.grid(row=1, column=1, padx=10, pady=5, sticky='w')

        self.refresh_button = ttk.Button(root, text="Refresh", command=self.refresh_graph)
        self.refresh_button.grid(row=4, column=0, columnspan=2, padx=10, pady=5)

        # Create matplotlib figure and canvas
        self.fig, (self.ax1, self.ax2) = plt.subplots(1, 2, figsize=(12, 6), gridspec_kw={'width_ratios': [2, 1]})
        self.canvas = FigureCanvasTkAgg(self.fig, master=root)
        self.canvas_widget = self.canvas.get_tk_widget()
        self.canvas_widget.grid(row=5, column=0, columnspan=2, sticky='nsew')

        self.update_thread = None
        self.stop_event = threading.Event()

    def fetch_stock_data(self, ticker, period):
        try:
            stock = yf.Ticker(ticker)
            data = stock.history(period=period)
            if data.empty:
                raise ValueError("No data available for the specified ticker and period.")
            return data
        except Exception as e:
            messagebox.showerror("Error", f"Failed to fetch stock data: {str(e)}")
            return None

    def calculate_rsi(self, data, window=14):
        delta = data['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))

    def perform_linear_regression(self, data):
        """Perform linear regression on the stock price data."""
        x = np.arange(len(data)).reshape(-1, 1)  # Time (as index)
        y = data['Close'].values  # Stock closing prices
        model = LinearRegression()
        model.fit(x, y)
        return model.predict(x)

    def create_graph(self, data, ticker):
        # Clear previous plots
        self.ax1.clear()
        self.ax2.clear()

        # Set background colors
        self.fig.set_facecolor('#032B44')
        self.ax1.set_facecolor('#87CEEB')
        self.ax2.set_facecolor('#87CEEB')

        # Plot stock price
        self.ax1.plot(data.index, data['Close'], color='white', label='Close Price')

        # Perform linear regression and plot the trendline
        linear_reg = self.perform_linear_regression(data)
        self.ax1.plot(data.index, linear_reg, color='orange', linestyle='--', label='Linear Regression')

        # Add indicators, signals, and table (as in your previous implementation)

        self.fig.tight_layout()
        self.canvas.draw()

    def refresh_graph(self):
        ticker = self.ticker_entry.get().upper()
        period = self.period_var.get()

        if not ticker:
            return

        # Fetch stock data
        data = self.fetch_stock_data(ticker, period)
        if data is None:
            return

        # Update graph
        self.create_graph(data, ticker)

def __init__(self, root):
        self.root = root
        self.root.title("Live Stock Data")
        self.root.geometry("1000x700")
        
        # Define smaller font size
        small_font = tkFont.Font(family="Helvetica", size=10)

        # Style configuration for ttk widgets
        style = ttk.Style()
        style.configure("TButton", font=("Helvetica", 10))
        style.configure("TLabel", font=("Helvetica", 10))
        style.configure("TMenubutton", font=("Helvetica", 10))

        # Labels and Buttons using ttk with style
        self.ticker_label = ttk.Label(root, text="Ticker Symbol:")
        self.ticker_label.pack()

        self.ticker_entry = ttk.Entry(root, width=15)
        self.ticker_entry.pack()

        self.period_label = ttk.Label(root, text="Time Period:")
        self.period_label.pack()

        self.period_var = tk.StringVar()
        self.period_menu = ttk.OptionMenu(root, self.period_var, "1mo", "3mo", "6mo", "1y")
        self.period_menu.pack()

        self.update_interval_label = ttk.Label(root, text="Update Interval (seconds):")
        self.update_interval_label.pack()

        self.update_interval_var = tk.StringVar()
        self.update_interval_menu = ttk.OptionMenu(root, self.update_interval_var, "60", "300", "600")
        self.update_interval_menu.pack()

        # Button using ttk with style
        self.refresh_button = ttk.Button(root, text="Refresh", command=self.refresh_graph, style="TButton")
        self.refresh_button.pack()

if __name__ == "__main__":
    root = tk.Tk()
    app = StockApp(root)
    root.mainloop()
