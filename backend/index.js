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

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
