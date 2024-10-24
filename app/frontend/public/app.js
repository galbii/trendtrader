let chart;

class Logger {
  static logLevels = {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3
  };

  static currentLevel = Logger.logLevels.INFO; // Adjust this for different environments

  static log(level, message, data = null) {
    if (level >= Logger.currentLevel) {
      const logEntry = {
        level: Logger.getLogLevelName(level),
        message,
        data,
        timestamp: new Date().toISOString()
      };

      console.log(logEntry);

      // Send the log to the backend
      Logger.sendLogToBackend(logEntry);
    }
  }

  static getLogLevelName(level) {
    switch (level) {
      case Logger.logLevels.DEBUG:
        return 'DEBUG';
      case Logger.logLevels.INFO:
        return 'INFO';
      case Logger.logLevels.WARNING:
        return 'WARNING';
      case Logger.logLevels.ERROR:
        return 'ERROR';
      default:
        return 'UNKNOWN';
    }
  }

  static sendLogToBackend(logEntry) {
    fetch('/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logEntry)
    })
    .then(response => response.json())
    .then(data => console.log('Log sent successfully:', data))
    .catch(error => console.error('Failed to send log:', error));
  }
}

// Example usage
Logger.log(Logger.logLevels.INFO, 'Fetching stock data...');
Logger.log(Logger.logLevels.DEBUG, 'Stock ticker:', 'AAPL', { ticker: 'AAPL' });
Logger.log(Logger.logLevels.ERROR, 'Failed to fetch stock data', { error: 'Network error' });

async function fetchStockData() {
  const ticker = document.getElementById('ticker').value;
  const period = document.getElementById('period').value;

  Logger.log(Logger.logLevels.INFO, 'Fetching stock data for ticker:', ticker, { ticker, period });

  try {
    const response = await fetch(`http://localhost:8000/stock/${ticker}/historical?interval=${period}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();

    Logger.log(Logger.logLevels.INFO, 'Received stock data successfully', { data });

    updateChart(data.times, data.prices);
  } catch (error) {
    Logger.log(Logger.logLevels.ERROR, 'Failed to fetch stock data', { error });
    alert('Failed to fetch stock data');
  }
}

function updateChart(labels, prices) {
    const ctx = document.getElementById('stock-chart').getContext('2d');

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Stock Price',
                data: prices,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute'
                    }
                },
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

window.onerror = function(message, url, line, col, error) {
  Logger.log(Logger.logLevels.ERROR, 'Uncaught exception:', error.message, { error });
};

// Initial chart setup
document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('stock-chart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Stock Price',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute'
                    }
                },
                y: {
                    beginAtZero: false
                }
            }
        }
    });
});
