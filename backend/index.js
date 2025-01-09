const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('msnodesqlv8');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');

const app = express();
const port = 5000;

app.use(
    cors({
        origin: 'http://localhost:3000', // Replace with your frontend URL
        methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
        credentials: true, // Allow credentials (cookies, etc.)
    })
);
app.use(cookieParser());
// Middleware
app.use(bodyParser.json());
// Allow OPTIONS requests for CORS preflight


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
            SELECT 
                m.CryptoID, 
                m.Symbol, 
                m.Name, 
                d.PriceUSD AS LatestPriceUSD, 
                d.VolumeUSD AS LatestVolumeUSD, 
                d.CollectionTime AS LastUpdated
            FROM CryptoMapping m
            JOIN CryptoData d ON m.CryptoID = d.CryptoID
            WHERE d.CollectionTime = (
                SELECT MAX(CollectionTime)
                FROM CryptoData
                WHERE CryptoID = d.CryptoID
            )
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

        conn.query(dataQuery, [cryptoId], (err, dataResult) => {
            conn.close();

            if (err) {
                console.error('Error fetching general data: ', err);
                return res.status(500).json({ error: 'Error fetching general data' });
            }

            if (dataResult.length === 0) {
                return res.status(404).json({ error: 'Crypto not found' });
            }

            res.json(dataResult);
        });
    });
});

app.get('/crypto/:cryptoId/ohlc', (req, res) => {
    const { cryptoId } = req.params;

    if (isNaN(cryptoId)) {
        return res.status(400).json({ error: 'Invalid crypto ID' });
    }

    sql.open(dbConfig.connectionString, (err, conn) => {
        if (err) {
            console.error('Database connection failed: ', err);
            return res.status(500).json({ error: 'Database connection failed' });
        }

        const ohlcQuery = `
            SELECT o.CryptoID, o.Symbol, o.[Open], o.High, o.Low, o.[Close], o.Volume, o.TimeframeStart
            FROM CryptoOHLC o
            WHERE o.CryptoID = ?
            ORDER BY o.TimeframeStart ASC
        `;

        conn.query(ohlcQuery, [cryptoId], (err, ohlcResult) => {
            conn.close();

            if (err) {
                console.error('Error fetching OHLC data: ', err);
                return res.status(500).json({ error: 'Error fetching OHLC data' });
            }

            res.json(ohlcResult);
        });
    });
});


app.post('/signup', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ error: 'Username, password, and email are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        sql.open(dbConfig.connectionString, (err, conn) => {
            if (err) return res.status(500).json({ error: 'Database connection failed.' });

            const query = `
                INSERT INTO Users (Username, PasswordHash, Email) 
                VALUES (?, ?, ?)
            `;
            conn.query(query, [username, hashedPassword, email], (err) => {
                conn.close();
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).json({ error: 'Username or email already exists.' });
                    }
                    return res.status(500).json({ error: 'Failed to register user.' });
                }
                res.status(201).json({ message: 'User registered successfully.' });
            });
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Log In Route
app.post('/login', async (req, res) => {
    const { identifier, password } = req.body; // Identifier can be username or email

    if (!identifier || !password) {
        return res.status(400).json({ error: 'Identifier and password are required.' });
    }

    sql.open(dbConfig.connectionString, (err, conn) => {
        if (err) return res.status(500).json({ error: 'Database connection failed.' });

        const query = `
            SELECT * FROM Users 
            WHERE Username = ? OR Email = ?
        `;
        conn.query(query, [identifier, identifier], async (err, rows) => {
            conn.close();
            if (err || rows.length === 0) {
                return res.status(400).json({ error: 'Invalid username/email or password.' });
            }

            const user = rows[0];
            const isPasswordMatch = await bcrypt.compare(password, user.PasswordHash);

            if (!isPasswordMatch) {
                return res.status(400).json({ error: 'Invalid username/email or password.' });
            }
            const username = user.Username;
            const token = jwt.sign({ username }, 'jwt-secret-key', { expiresIn: '1h' });
            res.cookie('token', token, {
                httpOnly: true, // Ensure cookies are not accessible via JavaScript
                secure: false,  // Set to true if using HTTPS
                sameSite: 'Lax', // Ensures the cookie is sent with same-site requests
            });

            res.status(200).json({ message: 'Login successful.', userID: user.UserID });
        });
    });
});

app.get('/check', (req, res) => {
    const token = req.cookies.token; // Read token from cookies

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, 'jwt-secret-key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Send response with authentication status and username
        res.status(200).json({ isAuthenticated: true, username: decoded.username });
    });
});

app.post('/logout', (req, res) => {
    res.clearCookie('token'); // Clear the token cookie
    res.status(200).json({ message: 'Logged out successfully' });
});

app.post('/favorites', (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, 'jwt-secret-key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { username } = decoded; // Extract username from token
        const { cryptoId } = req.body; // Extract cryptoId from request body

        if (!cryptoId) {
            return res.status(400).json({ error: 'CryptoID is required.' });
        }

        sql.open(dbConfig.connectionString, (err, conn) => {
            if (err) {
                return res.status(500).json({ error: 'Database connection failed.' });
            }

            // Fetch UserID based on Username
            const getUserIdQuery = `
                SELECT UserID FROM Users WHERE Username = ?
            `;
            conn.query(getUserIdQuery, [username], (err, rows) => {
                if (err || rows.length === 0) {
                    conn.close();
                    return res.status(500).json({ error: 'Failed to retrieve UserID.' });
                }

                const userId = rows[0].UserID;

                // Insert into Favorites table
                const insertQuery = `
                    INSERT INTO Favorites (UserID, Username, CryptoID) 
                    VALUES (?, ?, ?)
                `;

                conn.query(insertQuery, [userId, username, cryptoId], (err) => {
                    conn.close();

                    if (err) {
                        if (err.message.includes('UNIQUE')) {
                            return res.status(400).json({ error: 'Crypto already in favorites.' });
                        }
                        return res.status(500).json({ error: 'Failed to add to favorites.' });
                    }

                    res.status(201).json({ message: 'Added to favorites.' });
                });
            });
        });
    });
});

app.get('/favorites', (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, 'jwt-secret-key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { username } = decoded; // Extract username from token

        sql.open(dbConfig.connectionString, (err, conn) => {
            if (err) {
                return res.status(500).json({ error: 'Database connection failed.' });
            }

            const query = `
                SELECT 
                    f.CryptoID, 
                    m.Name, 
                    m.Symbol, 
                    d.PriceUSD AS LatestPriceUSD, 
                    d.VolumeUSD AS LatestVolumeUSD
                FROM Favorites f
                JOIN CryptoMapping m ON f.CryptoID = m.CryptoID
                JOIN CryptoData d ON f.CryptoID = d.CryptoID
                WHERE f.Username = ?
                  AND d.CollectionTime = (
                      SELECT MAX(CollectionTime) 
                      FROM CryptoData 
                      WHERE CryptoID = f.CryptoID
                  )
            `;

            conn.query(query, [username], (err, result) => {
                conn.close();

                if (err) {
                    return res.status(500).json({ error: 'Failed to fetch favorites.' });
                }

                res.json(result);
            });
        });
    });
});

app.delete('/favorites/:cryptoID', (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, 'jwt-secret-key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { username } = decoded; // Extract username from the token
        const { cryptoID } = req.params; // Get CryptoID from the route parameter

        if (!cryptoID) {
            return res.status(400).json({ error: 'CryptoID is required.' });
        }

        sql.open(dbConfig.connectionString, (err, conn) => {
            if (err) {
                return res.status(500).json({ error: 'Database connection failed.' });
            }

            const query = `
                DELETE FROM Favorites 
                WHERE Username = ? AND CryptoID = ?
            `;

            conn.query(query, [username, cryptoID], (err) => {
                conn.close();

                if (err) {
                    return res.status(500).json({ error: 'Failed to remove from favorites.' });
                }

                res.status(200).json({ message: 'Removed from favorites.' });
            });
        });
    });
});

app.post('/alerts', (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, 'jwt-secret-key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { username } = decoded; // Extract username from the token
        const { cryptoId, targetPrice } = req.body;

        if (!cryptoId || !Number.isFinite(targetPrice) || targetPrice <= 0) {
            return res.status(400).json({ error: 'CryptoID and a valid TargetPrice are required.' });
        }

        sql.open(dbConfig.connectionString, (err, conn) => {
            if (err) {
                console.error('Database connection failed:', err);
                return res.status(500).json({ error: 'Database connection failed.' });
            }

            // Fetch UserID based on Username
            const getUserIdQuery = `SELECT UserID FROM Users WHERE Username = ?`;
            conn.query(getUserIdQuery, [username], (err, rows) => {
                if (err || rows.length === 0) {
                    conn.close();
                    return res.status(500).json({ error: 'Failed to retrieve UserID.' });
                }

                const userId = rows[0].UserID;

                // Insert into PriceAlerts table
                const insertQuery = `
                    INSERT INTO PriceAlerts (UserID, CryptoID, TargetPrice, IsTriggered) 
                    VALUES (?, ?, ?, 0)
                `;
                conn.query(insertQuery, [userId, cryptoId, targetPrice], (err) => {
                    conn.close();

                    if (err) {
                        console.error('Error inserting alert:', err);
                        return res.status(500).json({ error: 'Failed to create alert.' });
                    }

                    res.status(201).json({ message: 'Alert created successfully.' });
                });
            });
        });
    });
});

const sendEmail = (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'your-email@gmail.com',
            pass: 'your-email-password',
        },
    });

    const mailOptions = {
        from: 'your-email@gmail.com',
        to,
        subject,
        text,
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error('Error sending email: ', err);
        } else {
            console.log('Email sent: ', info.response);
        }
    });
};

// Periodic Price Alert Checker
setInterval(() => {
    console.log('Checking price alerts...');

    sql.open(dbConfig.connectionString, (err, conn) => {
        if (err) {
            console.error('Database connection failed: ', err);
            return;
        }

        const query = `
            SELECT a.AlertID, a.UserID, a.CryptoID, a.TargetPrice, u.Email, m.Name, d.PriceUSD
            FROM PriceAlerts a
            JOIN Users u ON a.UserID = u.UserID
            JOIN CryptoMapping m ON a.CryptoID = m.CryptoID
            JOIN CryptoData d ON a.CryptoID = d.CryptoID
            WHERE a.IsTriggered = 0 AND d.PriceUSD >= a.TargetPrice
        `;

        conn.query(query, (err, alerts) => {
            if (err) {
                conn.close();
                console.error('Error fetching alerts: ', err);
                return;
            }

            alerts.forEach(alert => {
                sendEmail(
                    alert.Email,
                    `Price Alert for ${alert.Name}`,
                    `The price of ${alert.Name} has reached $${alert.TargetPrice}. Current price is $${alert.PriceUSD}.`
                );

                const updateQuery = `UPDATE PriceAlerts SET IsTriggered = 1 WHERE AlertID = ?`;
                conn.query(updateQuery, [alert.AlertID], (err) => {
                    if (err) {
                        console.error('Failed to update alert status: ', err);
                    }
                });
            });

            conn.close();
        });
    });
}, 60000); // Check every minute

app.get('/alerts', (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, 'jwt-secret-key', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { username } = decoded; // Extract username from token

        sql.open(dbConfig.connectionString, (err, conn) => {
            if (err) {
                console.error('Database connection failed:', err);
                return res.status(500).json({ error: 'Database connection failed.' });
            }

            // Fetch UserID based on Username
            const getUserIdQuery = `SELECT UserID FROM Users WHERE Username = ?`;
            conn.query(getUserIdQuery, [username], (err, rows) => {
                if (err || rows.length === 0) {
                    conn.close();
                    return res.status(500).json({ error: 'Failed to retrieve UserID.' });
                }

                const userId = rows[0].UserID;

                // Fetch alerts for the UserID
                const query = `
                    SELECT 
                        pa.AlertID, 
                        pa.CryptoID, 
                        cm.Name AS CryptoName, 
                        pa.TargetPrice, 
                        pa.IsTriggered, 
                        pa.CreatedAt
                    FROM PriceAlerts pa
                    JOIN CryptoMapping cm ON pa.CryptoID = cm.CryptoID
                    WHERE pa.UserID = ?
                    ORDER BY pa.CreatedAt DESC
                `;

                conn.query(query, [userId], (err, results) => {
                    conn.close();

                    if (err) {
                        console.error('Error fetching alerts:', err);
                        return res.status(500).json({ error: 'Failed to fetch alerts.' });
                    }

                    res.json(results);
                });
            });
        });
    });
});



// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
