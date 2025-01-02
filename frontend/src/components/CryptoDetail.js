import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

const CryptoDetail = () => {
  const { cryptoId } = useParams(); // Get the CryptoID from the URL
  const navigate = useNavigate(); // For navigation
  const [cryptoData, setCryptoData] = useState([]); // State to store the general price data
  const [chartData, setChartData] = useState(null); // State to store data for the price chart
  const [ohlcChartData, setOhlcChartData] = useState(null); // State to store OHLC data for candlestick chart
  const [loading, setLoading] = useState(true); // Handle loading state
  const [error, setError] = useState(null); // Handle error state

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/crypto/${cryptoId}`);
        const data = response.data;

        if (!data.general || data.general.length === 0) {
          setError('No data found for this cryptocurrency.');
          setLoading(false);
          return;
        }

        // Set general price data
        setCryptoData(data.general);

        // Prepare data for the general price chart
        const labels = data.general.map(entry => new Date(entry.CollectionTime).toLocaleDateString());
        const prices = data.general.map(entry => entry.PriceUSD);

        setChartData({
          labels,
          datasets: [
            {
              label: `${data.general[0].Name} Price (USD)`,
              data: prices,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderWidth: 2,
              fill: true,
              tension: 0.1,
            },
          ],
        });

        // Handle OHLC data if present
        if (data.ohlc && data.ohlc.length > 0) {
          const ohlcChartData = {
            labels: data.ohlc.map(entry => new Date(entry.TimeframeStart).toLocaleString()),
            datasets: [
              {
                label: `${data.general[0].Name} OHLC`,
                data: data.ohlc.map(entry => ({
                  x: new Date(entry.TimeframeStart),
                  y: [entry.Open, entry.High, entry.Low, entry.Close],
                })),
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderWidth: 2,
              },
            ],
          };

          setOhlcChartData(ohlcChartData);
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch cryptocurrency data.');
        setLoading(false);
      }
    };

    fetchCryptoData();
  }, [cryptoId]);

  const handleCandlestickView = () => {
    navigate(`/crypto/${cryptoId}/candlestick`);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>
        {cryptoData[0].Name} ({cryptoData[0].Symbol})
      </h1>
      <p>Current Price: ${cryptoData[cryptoData.length - 1].PriceUSD.toFixed(2)}</p>
      <div>
        {chartData && (
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: `${cryptoData[0].Name} Price Over Time`,
                },
                legend: {
                  display: true,
                  position: 'top',
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Date',
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
      <button onClick={handleCandlestickView} style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px' }}>
        View Candlestick Chart
      </button>
    </div>
  );
};

export default CryptoDetail;
