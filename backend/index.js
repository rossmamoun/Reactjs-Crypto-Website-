// backend/index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('msnodesqlv8'); // Import msnodesqlv8 for SQL Server connection

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
    // Close the connection
    conn.close();
});

// Define routes
app.get('/', (req, res) => {
    res.send('Welcome to the Crypto Data API!');
});

// Example endpoint to fetch data
app.get('/cryptos', async (req, res) => {
    try {
        sql.open(dbConfig.connectionString, (err, conn) => {
            if (err) {
                console.error('Database connection failed: ', err);
                res.status(500).send('Server error');
                return;
            }

            conn.query('SELECT * FROM CryptoData', (err, result) => {
                if (err) {
                    console.error('Error fetching data: ', err);
                    res.status(500).send('Server error');
                    return;
                }
                res.json(result);
                conn.close();
            });
        });
    } catch (err) {
        console.error('Error fetching data: ', err);
        res.status(500).send('Server error');
    }
});

// New endpoint to fetch detailed crypto information
app.get('/crypto/:id', async (req, res) => {
    const { id } = req.params;

    try {
        sql.open(dbConfig.connectionString, (err, conn) => {
            if (err) {
                console.error('Database connection failed: ', err);
                res.status(500).send('Server error');
                return;
            }

            conn.query('SELECT * FROM CryptoData WHERE ID = ?', [id], (err, result) => {
                if (err) {
                    console.error('Error fetching data: ', err);
                    res.status(500).send('Server error');
                    return;
                }

                const crypto = result[0];
                // Mock data for historical prices, replace with actual API call if needed
                const prices = getHistoricalPrices(crypto.Symbol);
                res.json({ ...crypto, prices });
                conn.close();
            });
        });
    } catch (err) {
        console.error('Error fetching data: ', err);
        res.status(500).send('Server error');
    }
});

function getHistoricalPrices(symbol) {
    // Mock data for historical prices, replace with actual API call
    return [
        { date: '2024-12-01', value: 50000 },
        { date: '2024-12-02', value: 51000 },
        { date: '2024-12-03', value: 52000 },
    ];
}

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});