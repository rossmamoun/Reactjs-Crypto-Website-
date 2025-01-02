import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, Title, Tooltip, Legend } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import { Chart } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns'; // Ensure date adapter is imported

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
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
        const response = await axios.get(`http://localhost:5000/crypto/${cryptoId}`);
        const ohlcData = response.data.ohlc;

        if (!ohlcData || ohlcData.length === 0) {
          setError('No OHLC data found for this cryptocurrency.');
          setLoading(false);
          return;
        }

        const financialData = ohlcData.map(entry => ({
          x: new Date(entry.TimeframeStart),
          o: entry.Open,
          h: entry.High,
          l: entry.Low,
          c: entry.Close,
        }));

        setChartData({
          datasets: [
            {
              label: `${response.data.general[0].Name} OHLC`,
              data: financialData,
              color: {
                up: 'rgba(75, 192, 192, 1)',
                down: 'rgba(255, 99, 132, 1)',
              },
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

  if (loading) return <div>Loading...</div>;
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
                text: 'Candlestick Chart',
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
              },
            },
          }}
        />
      )}
    </div>
  );
};

export default CandlestickChart;
