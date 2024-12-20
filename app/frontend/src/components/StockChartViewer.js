import React from 'react';
import { Line } from 'react-chartjs-2';

const StockChartViewer = ({
  isLoading,
  error,
  ticker,
  setTicker,
  range,
  setRange,
  interval,
  setInterval,
  tradeLog,
  newTrade,
  setNewTrade,
  showSMA,
  setShowSMA,
  showEMA,
  setShowEMA,
  smaPeriod,
  setSmaPeriod,
  emaPeriod,
  setEmaPeriod,
  showMACD,
  setShowMACD,
  showRSI,
  setShowRSI,
  showRegression,
  setShowRegression,
  regressionData,
  handleAddTrade,
  handleRemoveTrade,
  chartData,
  macdRsiData,
}) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        titleFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 14
        },
        bodyFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 12
        },
        padding: 12,
        borderColor: 'rgba(107, 114, 128, 0.2)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 11
          }
        }
      }
    }
  };

  const macdRsiOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        min: -1,
        max: 1
      }
    }
  };

	return (
	  <div className="min-h-screen bg-gray-50">
	    {/* Header */}
	    <header className="bg-white shadow-sm">
	      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
		<h1 className="text-2xl font-semibold text-gray-900">Trend Trader</h1>
	      </div>
	    </header>

	    {/* Main Content */}
	    <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
	      {/* Error Alert */}
	      {error && (
		<div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
		  <p className="font-medium">Error</p>
		  <p className="text-sm">{error}</p>
		</div>
	      )}

	      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
		{/* Left Column - Charts */}
		<div className="lg:col-span-2 space-y-6">
		  {/* Main Chart */}
		  <div className="bg-white rounded-lg shadow p-6">
		    {isLoading ? (
		      <div className="flex justify-center items-center h-96">
			<div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
		      </div>
		    ) : (
		      <div className="h-96">
			<Line data={chartData} options={chartOptions} />
		      </div>
		    )}
		  </div>

		  {/* MACD/RSI Chart */}
		  {!isLoading && (showMACD || showRSI) && (
		    <div className="bg-white rounded-lg shadow p-6">
		      <div className="h-64">
			<Line data={macdRsiData} options={macdRsiOptions} />
		      </div>
		    </div>
		  )}
		</div>

		{/* Right Column - Controls */}
		<div className="space-y-6">
		  {/* Search and Filters */}
		  <div className="bg-white rounded-lg shadow p-6 space-y-4">
		    <div>
		      <label htmlFor="ticker" className="block text-sm font-medium text-gray-700">
			Ticker Symbol
		      </label>
		      <input
			type="text"
			id="ticker"
			value={ticker}
			onChange={(e) => setTicker(e.target.value.toUpperCase())}
			className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
			disabled={isLoading}
		      />
		    </div>

		    <div className="grid grid-cols-2 gap-4">
		      <div>
			<label htmlFor="range" className="block text-sm font-medium text-gray-700">
			  Range
			</label>
			<select
			  id="range"
			  value={range}
			  onChange={(e) => setRange(e.target.value)}
			  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
			  disabled={isLoading}
			>
			  <option value="1d">1 Day</option>
			  <option value="5d">5 Days</option>
			  <option value="1mo">1 Month</option>
			  <option value="6mo">6 Months</option>
			  <option value="1y">1 Year</option>
			</select>
		      </div>

		      <div>
			<label htmlFor="interval" className="block text-sm font-medium text-gray-700">
			  Interval
			</label>
			<select
			  id="interval"
			  value={interval}
			  onChange={(e) => setInterval(e.target.value)}
			  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
			  disabled={isLoading}
			>
			  <option value="1m">1 Minute</option>
			  <option value="5m">5 Minutes</option>
			  <option value="15m">15 Minutes</option>
			  <option value="1h">1 Hour</option>
			  <option value="1d">1 Day</option>
			</select>
		      </div>
		    </div>
		  </div>

		  {/* Technical Indicators */}
		  <div className="bg-white rounded-lg shadow p-6 space-y-4">
		    <h3 className="text-lg font-medium text-gray-900">Technical Indicators</h3>
		    
		    <div className="space-y-3">
		      <div className="flex items-center justify-between">
			<div className="flex items-center">
			  <input
			    type="checkbox"
			    id="sma"
			    checked={showSMA}
			    onChange={() => setShowSMA(!showSMA)}
			    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
			    disabled={isLoading}
			  />
			  <label htmlFor="sma" className="ml-2 text-sm text-gray-700">
			    SMA
			  </label>
			</div>
			{showSMA && (
			  <input
			    type="number"
			    value={smaPeriod}
			    onChange={(e) => setSmaPeriod(parseInt(e.target.value))}
			    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
			    disabled={isLoading}
			    min="1"
			  />
			)}
		      </div>

		      <div className="flex items-center justify-between">
			<div className="flex items-center">
			  <input
			    type="checkbox"
			    id="ema"
			    checked={showEMA}
			    onChange={() => setShowEMA(!showEMA)}
			    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
			    disabled={isLoading}
			  />
			  <label htmlFor="ema" className="ml-2 text-sm text-gray-700">
			    EMA
			  </label>
			</div>
			{showEMA && (
			  <input
			    type="number"
			    value={emaPeriod}
			    onChange={(e) => setEmaPeriod(parseInt(e.target.value))}
			    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
			    disabled={isLoading}
			    min="1"
			  />
			)}
		      </div>

		      <div className="flex items-center">
			<input
			  type="checkbox"
			  id="macd"
			  checked={showMACD}
			  onChange={() => setShowMACD(!showMACD)}
			  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
			  disabled={isLoading}
			/>
			<label htmlFor="macd" className="ml-2 text-sm text-gray-700">
			  MACD
			</label>
		      </div>

		      <div className="flex items-center">
			<input
			  type="checkbox"
			  id="rsi"
			  checked={showRSI}
			  onChange={() => setShowRSI(!showRSI)}
			  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
			  disabled={isLoading}
			/>
			<label htmlFor="rsi" className="ml-2 text-sm text-gray-700">
			  RSI
			</label>
		      </div>

		      <div className="flex items-center">
			<input
			  type="checkbox"
			  id="regression"
			  checked={showRegression}
			  onChange={() => setShowRegression(!showRegression)}
			  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
			  disabled={isLoading}
			/>
			<label htmlFor="regression" className="ml-2 text-sm text-gray-700">
			  Regression
			</label>
		      </div>
		    </div>
		  </div>

		  {/* Trade Log */}
		  <div className="bg-white rounded-lg shadow p-6 space-y-4">
		    <h3 className="text-lg font-medium text-gray-900">Trade Log</h3>
		    
		    <div className="space-y-3">
		      <input
			type="number"
			value={newTrade.price}
			onChange={(e) => setNewTrade({ ...newTrade, price: e.target.value })}
			placeholder="Enter price"
			className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
			disabled={isLoading}
		      />
		      <button
			onClick={handleAddTrade}
			className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={isLoading || !newTrade.price}
		      >
			Log Trade
		      </button>
		    </div>

		    <div className="mt-4">
		      <div className="overflow-x-auto">
			<table className="min-w-full divide-y divide-gray-200">
			  <thead>
			    <tr>
			      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
			      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
			      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
			    </tr>
			  </thead>
			  <tbody className="divide-y divide-gray-200">
			    {tradeLog.map((trade, index) => (
			      <tr key={index}>
				<td className="px-4 py-2">
				  <button
				    onClick={() => handleRemoveTrade(index)}
				    className="text-red-600 hover:text-red-800"
				    disabled={isLoading}
				  >
				    Remove
				  </button>
				</td>
				<td className="px-4 py-2 text-sm text-gray-900">{trade.time}</td>
				<td className="px-4 py-2 text-sm text-gray-900">${trade.price}</td>
			      </tr>
			    ))}
			    {tradeLog.length === 0 && (
			      <tr>
				<td colSpan="3" className="px-4 py-4 text-sm text-gray-500 text-center">
				  No trades logged
				</td>
			      </tr>
			    )}
			  </tbody>
			</table>
		      </div>
		    </div>
		  </div>

		  {/* Regression Data */}
		  {showRegression && regressionData && !isLoading && (
		    <div className="bg-white rounded-lg shadow p-6 space-y-4">
		      <h3 className="text-lg font-medium text-gray-900">Regression Analysis</h3>
		      <div className="overflow-x-auto">
			<table className="min-w-full divide-y divide-gray-200">
			  <thead>
			    <tr>
			      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
				Predicted Price
			      </th>
			    </tr>
			  </thead>
			  <tbody className="divide-y divide-gray-200">
			    {regressionData.slice(0, 5).map((price, index) => (
			      <tr key={index}>
				<td className="px-4 py-2 text-sm text-gray-900">
				  ${price.toFixed(2)}
				</td>
			      </tr>
			    ))}
			  </tbody>
			</table>
		      </div>
		    </div>
		  )}
		</div>
	      </div>
	    </main>
	  </div>
);
};
export default StockChartViewer;

