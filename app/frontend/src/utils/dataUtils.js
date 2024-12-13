
export const formatTimestamps = (timestamps, range, interval) => {
  return timestamps.map((ts) => {
    const date = new Date(ts * 1000);
    switch (range) {
      case '1d':
        return interval === '1m' || interval === '5m' 
          ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          : date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
      case '5d':
      case '1mo':
        return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
      case '6mo':
      case '1y':
        return date.toLocaleDateString([], {month: 'short', year: 'numeric'});
      default:
        return date.toLocaleDateString();
    }
  });
};

// SMA calculation
export const calculateSMA = (data, period) => {
  const sma = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, price) => acc + price, 0);
    sma.push(sum / period);
  }
  return sma;
};

// EMA calculation
export const calculateEMA = (data, period) => {
  const ema = [];
  const k = 2 / (period + 1);
  ema.push(data[0]);  // Set the first EMA value as the first price

  for (let i = 1; i < data.length; i++) {
    const value = (data[i] - ema[i - 1]) * k + ema[i - 1];
    ema.push(value);
  }
  return ema;
};

// Normalize data for RSI/MACD
export const normalizeData = (data) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  return data.map((value) => (2 * (value - min)) / (max - min) - 1);  // Normalize to -1 to 1
};
