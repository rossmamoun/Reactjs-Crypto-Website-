import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

const CryptoDetail = () => {
  const { cryptoId } = useParams();
  const navigate = useNavigate();
  const [cryptoData, setCryptoData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        // Fetch general price data
        const response = await axios.get(`http://localhost:5000/crypto/${cryptoId}`);
        const data = response.data;

        if (!data || data.length === 0) {
          setError('No data found for this cryptocurrency.');
          setLoading(false);
          return;
        }

        setCryptoData(data);

        // Prepare data for the general price chart
        const labels = data.map(entry => new Date(entry.CollectionTime).toLocaleDateString());
        const prices = data.map(entry => entry.PriceUSD);

        setChartData({
          labels,
          datasets: [
            {
              label: `${data[0].Name} Price (USD)`,
              data: prices,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderWidth: 2,
              fill: true,
              tension: 0.1,
            },
          ],
        });

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
