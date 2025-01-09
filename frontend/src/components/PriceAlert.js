import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SetAlert = () => {
    const [cryptos, setCryptos] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [selectedCrypto, setSelectedCrypto] = useState('');
    const [targetPrice, setTargetPrice] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch available cryptocurrencies
    useEffect(() => {
        const fetchCryptos = async () => {
            try {
                const response = await axios.get('http://localhost:5000/cryptos');
                setCryptos(response.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch cryptocurrencies.');
                setLoading(false);
            }
        };

        const fetchAlerts = async () => {
            try {
                const response = await axios.get('http://localhost:5000/alerts', {
                    withCredentials: true,
                });
                setAlerts(response.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchCryptos();
        fetchAlerts();
    }, []);

    const handleCreateAlert = async (e) => {
        e.preventDefault();
    
        // Validate inputs
        if (!selectedCrypto) {
            alert("Please select a cryptocurrency.");
            return;
        }
        if (!targetPrice || targetPrice <= 0) {
            alert("Please enter a valid target price greater than 0.");
            return;
        }
    
        console.log("Selected Crypto:", selectedCrypto);
        console.log("Target Price:", targetPrice);
    
        try {
            const response = await axios.post(
                'http://localhost:5000/alerts',
                { cryptoId: selectedCrypto, targetPrice: parseFloat(targetPrice) },
                { withCredentials: true }
            );
            alert(response.data.message);
            setTargetPrice('');
            setSelectedCrypto('');
            const alertsResponse = await axios.get('http://localhost:5000/alerts', {
                withCredentials: true,
            });
            setAlerts(alertsResponse.data);
        } catch (err) {
            console.error("Error:", err.response?.data || err);
            alert(err.response?.data?.error || 'Failed to create alert.');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Set Price Alert</h2>

            {/* Create Alert Form */}
            <form onSubmit={handleCreateAlert} className="mb-6">
                <div className="mb-4">
                    <label className="block mb-2">Cryptocurrency</label>
                    <select
                        className="select select-bordered w-full max-w-md"
                        value={selectedCrypto}
                        onChange={(e) => setSelectedCrypto(e.target.value)}
                        required
                    >
                        <option value="">Select a cryptocurrency</option>
                        {cryptos.map((crypto) => (
                            <option key={crypto.CryptoID} value={crypto.CryptoID}>
                                {crypto.Name} ({crypto.Symbol})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block mb-2">Target Price</label>
                    <input
                        type="number"
                        className="input input-bordered w-full max-w-md"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary">
                    Create Alert
                </button>
            </form>

            {/* Display User's Alerts */}
            <h3 className="text-xl font-bold mb-4">Your Alerts</h3>
            {alerts.length === 0 ? (
                <p>No alerts created yet.</p>
            ) : (
                <div className="overflow-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Crypto</th>
                                <th>Target Price</th>
                                <th>Status</th>
                                <th>Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.map((alert, index) => (
                                <tr key={alert.AlertID}>
                                    <td>{index + 1}</td>
                                    <td>
                                        {alert.CryptoName} ({alert.CryptoID})
                                    </td>
                                    <td>${alert.TargetPrice.toFixed(2)}</td>
                                    <td>{alert.IsTriggered ? 'Triggered' : 'Active'}</td>
                                    <td>{new Date(alert.CreatedAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SetAlert;
