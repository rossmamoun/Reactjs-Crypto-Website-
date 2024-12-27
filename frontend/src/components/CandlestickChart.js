import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  CandlestickController,
  CandlestickElement
);

const CandlestickChart = () => {
  const { cryptoId } = useParams();
  const [ohlcData, setOhlcData] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOHLCData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/crypto/${cryptoId}/ohlc`);
        const data = response.data;

        if (data.length === 0) {
          setError('No OHLC data found for this cryptocurrency.');
          setLoading(false);
          return;
        }

        setOhlcData(data);

        const labels = data.map(entry => new Date(entry.TimeframeStart).toLocaleDateString());
        const financialData = data.map(entry => ({
          x: new Date(entry.TimeframeStart),
          o: entry.Open,
          h: entry.High,
          l: entry.Low,
          c: entry.Close,
        }));

        setChartData({
          labels,
          datasets: [
            {
              label: 'OHLC',
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
        <canvas
          id="candlestickChart"
          style={{ height: '400px', width: '600px' }}
        ></canvas>
      )}
    </div>
  );
};

export default CandlestickChart;
