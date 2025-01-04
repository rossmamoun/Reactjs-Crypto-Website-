import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Sidebar = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch favorites
    const fetchFavorites = () => {
        setLoading(true);
        axios
            .get('http://localhost:5000/favorites', { withCredentials: true })
            .then((response) => {
                setFavorites(response.data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.response?.data?.error || 'Failed to fetch favorites.');
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchFavorites();
    }, []);

    // Remove from favorites
    const removeFromFavorites = async (cryptoID) => {
        try {
            const response = await axios.delete(`http://localhost:5000/favorites/${cryptoID}`, {
                withCredentials: true,
            });
            alert(response.data.message);

            // Refresh the favorites list
            fetchFavorites();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to remove from favorites.');
        }
    };

    if (loading) return <div>Loading Favorites...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="sidebar">
            <h3>Your Favorites</h3>
            {favorites.length === 0 ? (
                <p>No favorites added yet.</p>
            ) : (
                <ul>
                    {favorites.map((crypto) => (
                        <li key={crypto.CryptoID}>
                            <h4>
                                {crypto.Name} ({crypto.Symbol})
                            </h4>
                            <p>Last Price: ${crypto.LatestPriceUSD?.toFixed(2) || 'N/A'}</p>
                            <Link to={`/crypto/${crypto.CryptoID}`}>View Chart</Link>
                            <button onClick={() => removeFromFavorites(crypto.CryptoID)}>Remove</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Sidebar;
