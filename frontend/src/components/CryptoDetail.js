import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

const CryptoDetail = () => {
  const { cryptoId } = useParams(); // Get the CryptoID from the URL
  const [cryptoData, setCryptoData] = useState([]); // Store the fetched data
  const [chartData, setChartData] = useState(null); // Store data for the chart
  const [loading, setLoading] = useState(true); // Handle loading state
  const [error, setError] = useState(null); // Handle error state

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/crypto/${cryptoId}`);
        const data = response.data;

        if (data.length === 0) {
          setError('No data found for this cryptocurrency.');
          setLoading(false);
          return;
        }

        setCryptoData(data);

        // Prepare data for the chart
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
    </div>
  );
};

export default CryptoDetail;
