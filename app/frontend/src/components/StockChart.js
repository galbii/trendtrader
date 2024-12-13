
import React from 'react';
import { Line } from 'react-chartjs-2';
import { ChartCanvas, Chart, CandlestickSeries, XAxis, YAxis } from 'react-financial-charts';
import * as d3 from 'd3-scale';

const StockChart = ({ chartType, chartData, ohlcData, labels }) => {
  return (
    <div style={{ flex: 1 }}>
      {chartType === 'line' ? (
        <Line data={chartData} />
      ) : (
        <ChartCanvas
          height={400}
          width={800}
          ratio={3}
          data={ohlcData}
          seriesName="AAPL"
          xAccessor={(d) => d.date}
          xScale={d3.scaleTime()}
          xExtents={[ohlcData[0]?.date, ohlcData[ohlcData.length - 1]?.date]}
        >
          <Chart id={1} yExtents={(d) => [d.high, d.low]}>
            <CandlestickSeries />
            <XAxis />
            <YAxis />
          </Chart>
        </ChartCanvas>
      )}
    </div>
  );
};

export default StockChart;
