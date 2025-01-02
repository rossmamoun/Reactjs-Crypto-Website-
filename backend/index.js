const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('msnodesqlv8');
const authRoutes = require('./auth');

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());
app.use('/', authRoutes);
app.use(cors());

// Database configuration
const dbConfig = {
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=cryptoDB;Trusted_Connection=yes;',
};

// Test database connection
sql.open(dbConfig.connectionString, (err, conn) => {
    if (err) {
        console.error('Database connection failed: ', err);
        return;
    }
    console.log('Connected to the database');
    conn.close();
});

// Routes

// Root Route
app.get('/', (req, res) => {
    res.send('Welcome to the Crypto Data API!');
});

// Get all cryptos with their latest prices
app.get('/cryptos', (req, res) => {
    sql.open(dbConfig.connectionString, (err, conn) => {
        if (err) {
            console.error('Database connection failed: ', err);
            return res.status(500).json({ error: 'Database connection failed' });
        }

        const query = `
            SELECT m.CryptoID, m.Symbol, m.Name, MAX(d.PriceUSD) AS LatestPriceUSD, MAX(d.VolumeUSD) AS LatestVolumeUSD, MAX(d.CollectionTime) AS LastUpdated
            FROM CryptoMapping m
            JOIN CryptoData d ON m.CryptoID = d.CryptoID
            GROUP BY m.CryptoID, m.Symbol, m.Name
        `;

        conn.query(query, (err, result) => {
            if (err) {
                console.error('Error fetching data: ', err);
                return res.status(500).json({ error: 'Error fetching data' });
            }

            res.json(result);
            conn.close();
        });
    });
});

// Get detailed data for a specific crypto
app.get('/crypto/:cryptoId', (req, res) => {
    const { cryptoId } = req.params;

    if (isNaN(cryptoId)) {
        return res.status(400).json({ error: 'Invalid crypto ID' });
    }

    sql.open(dbConfig.connectionString, (err, conn) => {
        if (err) {
            console.error('Database connection failed: ', err);
            return res.status(500).json({ error: 'Database connection failed' });
        }

        const dataQuery = `
            SELECT d.CryptoID, m.Name, m.Symbol, d.PriceUSD, d.VolumeUSD, d.CollectionTime
            FROM CryptoData d
            JOIN CryptoMapping m ON d.CryptoID = m.CryptoID
            WHERE d.CryptoID = ?
            ORDER BY d.CollectionTime ASC
        `;

        const ohlcQuery = `
            SELECT o.CryptoID, o.Symbol, o.[Open], o.High, o.Low, o.[Close], o.Volume, o.TimeframeStart
            FROM CryptoOHLC o
            WHERE o.CryptoID = ?
            ORDER BY o.TimeframeStart ASC
        `;

        conn.query(dataQuery, [cryptoId], (err, dataResult) => {
            if (err) {
                console.error('Error fetching general data: ', err);
                conn.close();
                return res.status(500).json({ error: 'Error fetching general data' });
            }

            if (dataResult.length === 0) {
                conn.close();
                return res.status(404).json({ error: 'Crypto not found' });
            }

            conn.query(ohlcQuery, [cryptoId], (err, ohlcResult) => {
                conn.close();

                if (err) {
                    console.error('Error fetching OHLC data: ', err);
                    return res.status(500).json({ error: 'Error fetching OHLC data' });
                }

                res.json({
                    general: dataResult,
                    ohlc: ohlcResult,
                });
            });
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
