import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './CryptoList.css'; // Import the new CSS file

const CryptoList = () => {
    const [cryptos, setCryptos] = useState([]); 
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:5000/cryptos')
            .then(response => {
                const uniqueCryptos = [];
                const seen = new Set();
                response.data.forEach(crypto => {
                    if (!seen.has(crypto.Symbol)) {
                        uniqueCryptos.push(crypto);
                        seen.add(crypto.Symbol);
                    }
                });
                setCryptos(uniqueCryptos);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const addToFavorites = async (cryptoId) => {
        try {
            const response = await axios.post(
                'http://localhost:5000/favorites',
                { cryptoId },
                { withCredentials: true }
            );
            alert(response.data.message);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to add to favorites.');
        }
    };

    if (loading) return <div>Loading cryptocurrency data...</div>; 
    if (error) return <div>Error fetching data: {error}</div>; 

    return (
        <div className="crypto-list-container">
            <h2>Cryptocurrencies</h2>
            <ul className="crypto-list">
                {cryptos.map(crypto => (
                    <li key={crypto.CryptoID}>
                        <h3>{crypto.Name} ({crypto.Symbol})</h3>
                        <p>Last Price: ${crypto.LatestPriceUSD.toFixed(2)}</p>
                        <Link to={`/crypto/${crypto.CryptoID}`}>View Details</Link>
                        <button onClick={() => addToFavorites(crypto.CryptoID)}>Add to Favorites</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CryptoList;