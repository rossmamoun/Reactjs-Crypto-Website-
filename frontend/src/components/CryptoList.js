import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './CryptoList.css'; // Import the new CSS file

const CryptoList = () => {
    const [cryptos, setCryptos] = useState([]); // All cryptos fetched from the backend
    const [filteredCryptos, setFilteredCryptos] = useState([]); // Cryptos after filtering/searching
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null); // Error state
    const [searchTerm, setSearchTerm] = useState(''); // Search input value
    const [filter, setFilter] = useState(''); // Filter selection (highest/lowest price)

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
                setFilteredCryptos(uniqueCryptos); // Initially, display all cryptos
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    // Handle adding a crypto to favorites
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

    // Handle search input
    const handleSearch = (e) => {
        const value = e.target.value.toLowerCase();
        setSearchTerm(value);
        filterCryptos(value, filter);
    };

    // Handle filter change
    const handleFilterChange = (e) => {
        const value = e.target.value;
        setFilter(value);
        filterCryptos(searchTerm, value);
    };

    // Apply filtering and searching logic
    const filterCryptos = (term, filterOption) => {
        let filtered = cryptos;

        // Filter by search term
        if (term) {
            filtered = filtered.filter(crypto =>
                crypto.Name.toLowerCase().includes(term) ||
                crypto.Symbol.toLowerCase().includes(term)
            );
        }

        // Sort by price
        if (filterOption === 'highest') {
            filtered = [...filtered].sort((a, b) => b.LatestPriceUSD - a.LatestPriceUSD);
        } else if (filterOption === 'lowest') {
            filtered = [...filtered].sort((a, b) => a.LatestPriceUSD - b.LatestPriceUSD);
        }

        setFilteredCryptos(filtered);
    };

    if (loading) return <div>Loading cryptocurrency data...</div>;
    if (error) return <div>Error fetching data: {error}</div>;

    return (
        <div className="crypto-list-container">
            <h2>Cryptocurrencies</h2>

            {/* Search Bar */}
            <input
                type="text"
                placeholder="Search by name or symbol..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-bar"
            />

            {/* Filter Dropdown */}
            <select value={filter} onChange={handleFilterChange} className="filter-dropdown">
                <option value="">Sort By</option>
                <option value="highest">Highest Price</option>
                <option value="lowest">Lowest Price</option>
            </select>

            {/* Crypto List */}
            <ul className="crypto-list">
                {filteredCryptos.map(crypto => (
                    <li key={crypto.CryptoID}>
                        <h3>{crypto.Name} ({crypto.Symbol})</h3>
                        <p>Last Price: ${crypto.LatestPriceUSD}</p>
                        <Link to={`/crypto/${crypto.CryptoID}`}>View Details</Link>
                        <button onClick={() => addToFavorites(crypto.CryptoID)}>Add to Favorites</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CryptoList;
