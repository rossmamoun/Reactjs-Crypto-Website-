import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Title,
} from 'chart.js';
import {
  CandlestickController,
  CandlestickElement,
} from 'chartjs-chart-financial';
import { Chart } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Title,
  CandlestickController,
  CandlestickElement
);

const CandlestickChart = () => {
  const { cryptoId } = useParams();
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOHLCData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/crypto/${cryptoId}/ohlc`);
        const data = response.data;

        if (data.length === 0) {
          setError('No OHLC data available for this cryptocurrency.');
          setLoading(false);
          return;
        }

        const financialData = data.map(entry => ({
          x: new Date(entry.TimeframeStart),
          o: entry.Open,
          h: entry.High,
          l: entry.Low,
          c: entry.Close,
        }));

        setChartData({
          datasets: [
            {
              label: `${data[0].Symbol} Candlestick Data`,
              data: financialData,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              barPercentage: 0.03, // Reduce candlestick width
              categoryPercentage: 1.5, // Add spacing between candlesticks
            },
          ],
        });

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch OHLC data.');
        setLoading(false);
      }
    };

    fetchOHLCData();
  }, [cryptoId]);

  if (loading) return <div>Loading Candlestick Chart...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>Candlestick Chart</h1>
      {chartData && (
        <Chart
          type="candlestick"
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: `${chartData.datasets[0].label}`,
              },
              tooltip: {
                mode: 'index',
                intersect: false,
              },
            },
            scales: {
              x: {
                type: 'time',
                time: {
                  unit: 'minute',
                },
                title: {
                  display: true,
                  text: 'Time',
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Price (USD)',
                },
                beginAtZero: false,
              },
            },
          }}
        />
      )}
    </div>
  );
};

export default CandlestickChart;
