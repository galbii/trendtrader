let stockChart = null;
let intervalId = null;

async function fetchStockData() {
    const ticker = document.getElementById("ticker").value;
    const period = document.getElementById("period").value;  // Get selected period (e.g., 1m, 5m)

    if (!ticker) {
        alert("Please enter a stock ticker.");
        return;
    }

    // Stop any previous interval
    if (intervalId) {
        clearInterval(intervalId);
    }

    try {
        // Fetch historical stock data and plot it
        await queryHistoricalStockData(ticker, period);

        // Set up an interval to fetch live data
        intervalId = setInterval(() => {
            queryLiveStockData(ticker);
        }, getPeriodMilliseconds(period));
    } catch (error) {
        console.error("Error fetching stock data:", error);
        alert("Failed to fetch stock data. Please try again.");
    }
}

// Fetch historical data for a specific period and display it on the graph
async function queryHistoricalStockData(ticker, period) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/stock/${ticker}/historical?interval=${period}`);
        const data = await response.json();
	console.log("Fetched Data: ", data);

        const times = data.times;
        const prices = data.prices;

        displayStockGraph(times, prices);
    } catch (error) {
        console.error("Error fetching historical stock data:", error);
    }
}

// Fetch live data and update the graph with the new point
async function queryLiveStockData(ticker) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/stock/${ticker}/live`);
        const data = await response.json();

        const liveTime = data.time;
        const livePrice = data.price;

        // Add live data point to the chart
        updateGraph(liveTime, livePrice);
    } catch (error) {
        console.error("Error fetching live stock data:", error);
    }
}

function displayStockGraph(times, prices) {
    const ctx = document.getElementById('stock-chart').getContext('2d');

    if (stockChart) {
        stockChart.destroy();  // Clear previous chart
    }

    stockChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: times,
            datasets: [{
                label: 'Stock Price',
                data: prices,
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false,
                tension: 0.1
            }]
        },
        options: {
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

function updateGraph(time, price) {
    // Push new time and price to the graph
    stockChart.data.labels.push(time);
    stockChart.data.datasets[0].data.push(price);
    stockChart.update();
}

function getPeriodMilliseconds(period) {
    switch (period) {
        case '1m': return 60000;   // 1 minute in milliseconds
        case '5m': return 300000;  // 5 minutes in milliseconds
        case '15m': return 900000; // 15 minutes in milliseconds
        default: return 60000;
    }
}
