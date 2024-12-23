const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('msnodesqlv8');

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());
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
            SELECT m.CryptoID, m.Symbol, m.Name, d.PriceUSD, d.VolumeUSD, MAX(d.CollectionTime) AS LastUpdated
            FROM CryptoMapping m
            JOIN CryptoData d ON m.CryptoID = d.CryptoID
            GROUP BY m.CryptoID, m.Symbol, m.Name, d.PriceUSD, d.VolumeUSD
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

// Get historical data for a specific crypto
app.get('/crypto/:cryptoId', (req, res) => {
    const { cryptoId } = req.params;

    // Validate cryptoId
    if (isNaN(cryptoId)) {
        return res.status(400).json({ error: 'Invalid crypto ID' });
    }

    sql.open(dbConfig.connectionString, (err, conn) => {
        if (err) {
            console.error('Database connection failed: ', err);
            return res.status(500).json({ error: 'Database connection failed' });
        }

        const query = `
            SELECT d.CryptoID, m.Name, m.Symbol, d.PriceUSD, d.VolumeUSD, d.CollectionTime
            FROM CryptoData d
            JOIN CryptoMapping m ON d.CryptoID = m.CryptoID
            WHERE d.CryptoID = ?
            ORDER BY d.CollectionTime ASC
        `;

        conn.query(query, [cryptoId], (err, result) => {
            if (err) {
                console.error('Error fetching data: ', err);
                return res.status(500).json({ error: 'Error fetching data' });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: 'Crypto not found' });
            }

            res.json(result);
            conn.close();
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
