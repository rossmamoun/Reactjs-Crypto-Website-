import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CryptoList = () => {
    const [cryptos, setCryptos] = useState([]);
    const [filteredCryptos, setFilteredCryptos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('');
    const [successMessage, setSuccessMessage] = useState(''); // Success message for alerts

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
                setFilteredCryptos(uniqueCryptos);
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
            setSuccessMessage(response.data.message); // Set success message
            setTimeout(() => setSuccessMessage(''), 3000); // Auto-hide after 3 seconds
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to add to favorites.');
        }
    };

    const handleSearch = (e) => {
        const value = e.target.value.toLowerCase();
        setSearchTerm(value);
        filterCryptos(value, filter);
    };

    const handleFilterChange = (e) => {
        const value = e.target.value;
        setFilter(value);
        filterCryptos(searchTerm, value);
    };

    const filterCryptos = (term, filterOption) => {
        let filtered = cryptos;

        if (term) {
            filtered = filtered.filter(crypto =>
                crypto.Name.toLowerCase().includes(term) ||
                crypto.Symbol.toLowerCase().includes(term)
            );
        }

        if (filterOption === 'highest') {
            filtered = [...filtered].sort((a, b) => b.LatestPriceUSD - a.LatestPriceUSD);
        } else if (filterOption === 'lowest') {
            filtered = [...filtered].sort((a, b) => a.LatestPriceUSD - b.LatestPriceUSD);
        }

        setFilteredCryptos(filtered);
    };

    if (loading) return <div className="text-center py-10 text-lg">Loading cryptocurrency data...</div>;
    if (error) return <div className="text-center text-error py-10 text-lg">{error}</div>;

    return (
        <div className="crypto-list-container p-6">
            <h2 className="text-2xl font-bold mb-4">Cryptocurrencies</h2>

            {/* Success Alert */}
            {successMessage && (
                <div className="alert alert-success shadow-lg mb-4">
                    <div>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="stroke-current flex-shrink-0 h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m1-4a9 9 0 11-6.218 15.412"
                            />
                        </svg>
                        <span>{successMessage}</span>
                    </div>
                </div>
            )}

            {/* Search and Filter Section */}
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:gap-4">
                <input
                    type="text"
                    placeholder="Search by name or symbol..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="input input-bordered w-full md:max-w-md"
                />
                <select
                    value={filter}
                    onChange={handleFilterChange}
                    className="select select-bordered w-full md:max-w-md"
                >
                    <option value="">Sort By</option>
                    <option value="highest">Highest Price</option>
                    <option value="lowest">Lowest Price</option>
                </select>
            </div>

            {/* Crypto List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCryptos.map(crypto => (
                    <div key={crypto.CryptoID} className="card w-full bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h3 className="text-lg font-bold">
                                {crypto.Name} ({crypto.Symbol})
                            </h3>
                            <p>Last Price: ${crypto.LatestPriceUSD}</p>
                            <div className="card-actions justify-end">
                                <Link to={`/crypto/${crypto.CryptoID}`} className="btn btn-primary">
                                    View Details
                                </Link>
                                <button
                                    onClick={() => addToFavorites(crypto.CryptoID)}
                                    className="btn btn-secondary"
                                >
                                    Add to Favorites
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CryptoList;
