import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { useStockChart } from './hooks/useStockChart';
import StockChartViewer from './components/StockChartViewer';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  zoomPlugin
);

const App = () => {
  const stockChartProps = useStockChart();
  
  // Configure main chart data
  const chartData = {
    labels: stockChartProps.labels,
    datasets: [
      {
        label: `${stockChartProps.ticker} Price`,
        data: stockChartProps.data,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 2,
        fill: true,
        pointRadius: stockChartProps.isLoading ? 0 : 3,
        pointHoverRadius: 5,
        pointBackgroundColor: "rgba(75, 192, 192, 1)",
        pointBorderColor: "#fff",
        tension: 0.4,
      },
      stockChartProps.showSMA && {
        label: `SMA (${stockChartProps.smaPeriod})`,
        data: stockChartProps.smaData,
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.4,
      },
      stockChartProps.showEMA && {
        label: `EMA (${stockChartProps.emaPeriod})`,
        data: stockChartProps.emaData,
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.4,
      },
      stockChartProps.showRegression && stockChartProps.regressionData && {
        label: "Price Prediction",
        data: stockChartProps.regressionData,
        borderColor: "rgba(255, 159, 64, 1)",
        borderDash: [5, 5],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
      }
    ].filter(Boolean),
  };

  // Configure MACD/RSI chart data
  const macdRsiData = {
    labels: stockChartProps.labels,
    datasets: [
      stockChartProps.showMACD && {
        label: "MACD Line",
        data: stockChartProps.macdData?.macd,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 1.5,
        pointRadius: 0,
        yAxisID: 'y',
      },
      stockChartProps.showMACD && {
        label: "Signal Line",
        data: stockChartProps.macdData?.signal,
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1.5,
        pointRadius: 0,
        yAxisID: 'y',
      },
      stockChartProps.showRSI && {
        label: "RSI",
        data: stockChartProps.rsiData,
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 1.5,
        pointRadius: 0,
        yAxisID: 'y1',
      },
    ].filter(Boolean),
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: stockChartProps.isLoading ? 0 : 1000,
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
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
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
        }
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
          },
          maxRotation: 0
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
          },
          callback: (value) => `$${value.toFixed(2)}`
        }
      }
    }
  };

  // MACD/RSI chart options
  const macdRsiOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        position: 'left',
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        }
      },
      y1: {
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        min: 0,
        max: 100,
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 11
          }
        }
      }
    }
  };

  return (
    <StockChartViewer
      {...stockChartProps}
      chartData={chartData}
      macdRsiData={macdRsiData}
      chartOptions={chartOptions}
      macdRsiOptions={macdRsiOptions}
    />
  );
};

export default App;
