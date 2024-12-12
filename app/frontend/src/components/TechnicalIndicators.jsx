
import React from 'react';
import { Line } from 'react-chartjs-2';

// Technical Indicators Component
const TechnicalIndicators = ({ rsiData, macdData, rsiLabel, macdLabel }) => {
  const rsiChartData = {
    labels: rsiLabel, // These should be the time labels for RSI
    datasets: [
      {
        label: 'RSI',
        data: rsiData,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        borderWidth: 1,
      },
    ],
  };

  const macdChartData = {
    labels: macdLabel, // These should be the time labels for MACD
    datasets: [
      {
        label: 'MACD',
        data: macdData,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        borderWidth: 1,
      },
    ],
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Technical Indicators</h3>
      <div style={{ height: '300px' }}>
        <h4>RSI</h4>
        <Line data={rsiChartData} options={{ responsive: true }} />
      </div>
      <div style={{ height: '300px' }}>
        <h4>MACD</h4>
        <Line data={macdChartData} options={{ responsive: true }} />
      </div>
    </div>
  );
};

export default TechnicalIndicators;
