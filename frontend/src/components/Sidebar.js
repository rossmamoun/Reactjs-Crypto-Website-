import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Sidebar = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
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
    }, []);

    const removeFromFavorites = async (cryptoID) => {
        try {
            await axios.delete(`http://localhost:5000/favorites/${cryptoID}`, {
                withCredentials: true,
            });
            setFavorites(favorites.filter((fav) => fav.CryptoID !== cryptoID));
        } catch (err) {
            alert('Failed to remove from favorites.');
        }
    };

    if (loading) return <div>Loading Favorites...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="h-screen w-64 bg-base-200 shadow-lg p-4 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Your Favorites</h2>
            <ul className="menu bg-base-100 rounded-box">
                {favorites.length > 0 ? (
                    favorites.map((crypto) => (
                        <li key={crypto.CryptoID} className="mb-2">
                            <Link to={`/crypto/${crypto.CryptoID}`} className="text-blue-500">
                                {crypto.Name} ({crypto.Symbol})
                            </Link>
                            <p className="text-sm text-gray-600">
                                Last Price: ${crypto.LatestPriceUSD.toFixed(2)}
                            </p>
                            <button
                                className="btn btn-sm btn-error mt-1"
                                onClick={() => removeFromFavorites(crypto.CryptoID)}
                            >
                                Remove from favorites
                            </button>
                        </li>
                    ))
                ) : (
                    <li className="text-gray-500">No favorites added yet.</li>
                )}
            </ul>
        </div>
    );
};

export default Sidebar;
