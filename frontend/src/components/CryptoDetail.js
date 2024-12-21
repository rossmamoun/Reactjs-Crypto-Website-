// frontend/src/components/CryptoDetail.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Line } from 'react-chartjs-2'; // Assuming you have installed chart.js and react-chartjs-2

function CryptoDetail() {
  const { id } = useParams();
  const [crypto, setCrypto] = useState(null);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchCrypto = async () => {
      const result = await axios.get(`crypto/${id}`);
      setCrypto(result.data);
      setChartData({
        labels: result.data.prices.map((price) => price.date),
        datasets: [
          {
            label: 'Price',
            data: result.data.prices.map((price) => price.value),
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            fill: false,
          },
        ],
      });
    };
    fetchCrypto();
  }, [id]);

  if (!crypto || !chartData) return <div>Loading...</div>;

  return (
    <div>
      <h1>{crypto.Name}</h1>
      <p>Symbol: {crypto.Symbol}</p>
      <p>Price: {crypto.PriceUSD}</p>
      <Line data={chartData} />
    </div>
  );
}

export default CryptoDetail;