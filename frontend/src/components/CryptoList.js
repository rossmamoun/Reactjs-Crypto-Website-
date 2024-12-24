import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CryptoList = () => {
    const [cryptos, setCryptos] = useState([]); // State to hold processed crypto data
    const [loading, setLoading] = useState(true); // State to handle loading status
    const [error, setError] = useState(null); // State to handle errors

    // Fetch crypto data from the backend
    useEffect(() => {
        axios.get('http://localhost:5000/cryptos')
            .then(response => {
                // Filter out duplicates and keep the latest entry for each cryptocurrency
                const uniqueCryptos = [];
                const seen = new Set();
                response.data.forEach(crypto => {
                    if (!seen.has(crypto.Symbol)) {
                        uniqueCryptos.push(crypto);
                        seen.add(crypto.Symbol);
                    }
                });
                setCryptos(uniqueCryptos); // Store filtered data in state
                setLoading(false); // Set loading to false after data is processed
            })
            .catch(err => {
                setError(err.message); // Set error message if something goes wrong
                setLoading(false); // Set loading to false even if error occurs
            });
    }, []); // Empty array means this effect runs only once after the component mounts

    if (loading) {
        return <div>Loading...</div>; // Show loading message
    }

    if (error) {
        return <div>Error: {error}</div>; // Show error message
    }

    return (
        <div>
            <h2>Cryptocurrencies</h2>
            <ul>
                {cryptos.map(crypto => (
                    <li key={crypto.CryptoID}> {/* Use CryptoID as the unique key */}
                        <h3>{crypto.Name} ({crypto.Symbol})</h3>
                        <p>Last Price: ${crypto.PriceUSD.toFixed(2)}</p> {/* Display last price */}
                        <Link to={`/crypto/${crypto.CryptoID}`}>View Details</Link> {/* Link to detailed view */}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CryptoList;
