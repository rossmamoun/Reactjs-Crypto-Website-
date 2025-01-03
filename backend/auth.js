/*
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sql = require('msnodesqlv8');

const router = express.Router();

// Database configuration
const dbConfig = {
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=cryptoDB;Trusted_Connection=yes;',
};

// User signup route
router.post('/signup', async (req, res) => {
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
router.post('/login', async (req, res) => {
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
            const isPasswordMatch = await bcrypt.compare(password, user.Password);

            if (!isPasswordMatch) {
                return res.status(400).json({ error: 'Invalid username/email or password.' });
            }

            res.status(200).json({ message: 'Login successful.', userID: user.UserID });
        });
    });
});

module.exports = router;
*/