import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Sidebar = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:5000/favorites', { withCredentials: true })
            .then((response) => {
                setFavorites(response.data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.response?.data?.error || 'Failed to fetch favorites.');
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Loading Favorites...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="sidebar">
            <h3>Your Favorites</h3>
            <ul>
                {favorites.map((crypto) => (
                    <li key={crypto.CryptoID}>
                        <h4>{crypto.Name} ({crypto.Symbol})</h4>
                        <p>Last Price: ${crypto.LatestPriceUSD.toFixed(2)}</p>
                        <Link to={`/crypto/${crypto.CryptoID}`}>View Chart</Link>
                        <button
                            onClick={async () => {
                                try {
                                    await axios.delete(`http://localhost:5000/favorites/${crypto.CryptoID}`, { withCredentials: true });
                                    setFavorites(favorites.filter((fav) => fav.CryptoID !== crypto.CryptoID));
                                } catch (err) {
                                    alert('Failed to remove from favorites.');
                                }
                            }}
                        >
                            Remove
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;
