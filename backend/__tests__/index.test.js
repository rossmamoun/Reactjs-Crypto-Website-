/**
 * __tests__/index.test.js
 * Exemple de tests Jest + Supertest pour couvrir index.js
 */

process.env.NODE_ENV = 'test'; 
// Ainsi, index.js n'appelle pas app.listen(...) une deuxième fois.

const request = require('supertest');
const app = require('../index');  // votre export "module.exports = app;"

// Mock du module msnodesqlv8 pour éviter de se connecter à la vraie base
jest.mock('msnodesqlv8', () => ({
  open: jest.fn((connectionString, callback) => {
    // On simule une "conn" simple avec query() et close()
    const mockConn = {
      query: jest.fn((sql, params, cb) => {
        // Par défaut, on ne retourne pas d'erreur, ni de données, sauf si ajusté
        cb && cb(null, []);
      }),
      close: jest.fn()
    };
    // On simule aucune erreur et on renvoie la connexion mockée
    callback && callback(null, mockConn);
  })
}));

// Mock de nodemailer pour éviter de vrais envois d'e-mail
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn((options, cb) => {
      cb && cb(null, { response: 'Fake email sent (mock)' });
    })
  }))
}));

// Quelques constantes/mocks
const VALID_TOKEN = 'FAKE_VALID_TOKEN';  // simulera un JWT valide
const INVALID_TOKEN = 'FAKE_INVALID_TOKEN';

// On mock jwt.verify pour les routes protégées
const jwt = require('jsonwebtoken');
jest.spyOn(jwt, 'verify').mockImplementation((token, secret, cb) => {
  if (token === VALID_TOKEN) {
    // Simule un token décodé
    cb(null, { username: 'TestUser' });
  } else {
    cb(new Error('Unauthorized'));
  }
});

describe('index.js routes tests', () => {

  // ---------------------------------------------------------------------------
  // GET '/'
  // ---------------------------------------------------------------------------
  test('GET / should return welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Welcome to the Crypto Data API/i);
  });

  // ---------------------------------------------------------------------------
  // GET '/cryptos'
  // ---------------------------------------------------------------------------
  test('GET /cryptos should return 200 and an array (mocked)', async () => {
    const res = await request(app).get('/cryptos');
    expect(res.statusCode).toBe(200);
    // Par défaut, on renvoie un tableau vide via le mock
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // GET '/crypto/:cryptoId'
  // ---------------------------------------------------------------------------
  test('GET /crypto/:cryptoId with invalid param should return 400', async () => {
    const res = await request(app).get('/crypto/abc'); // 'abc' n'est pas un nombre
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ error: 'Invalid crypto ID' });
  });

  test('GET /crypto/:cryptoId not found should return 404', async () => {
    // On va customiser le mock pour renvoyer []
    const msnodesqlv8 = require('msnodesqlv8');
    msnodesqlv8.open.mockImplementationOnce((connStr, cb) => {
      // On simule une conn qui renvoie un tableau vide => 404
      const mockConn = {
        query: (sql, params, done) => done(null, []),
        close: jest.fn()
      };
      cb(null, mockConn);
    });

    const res = await request(app).get('/crypto/123');
    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({ error: 'Crypto not found' });
  });

  test('GET /crypto/:cryptoId success returns array', async () => {
    // On simule un retour non vide
    const msnodesqlv8 = require('msnodesqlv8');
    msnodesqlv8.open.mockImplementationOnce((connStr, cb) => {
      const mockConn = {
        query: (sql, params, done) => {
          const data = [{ CryptoID: 123, Name: 'TestCoin' }];
          done(null, data);
        },
        close: jest.fn()
      };
      cb(null, mockConn);
    });

    const res = await request(app).get('/crypto/123');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty('CryptoID', 123);
    expect(res.body[0]).toHaveProperty('Name', 'TestCoin');
  });

  // ---------------------------------------------------------------------------
  // GET '/crypto/:cryptoId/ohlc'
  // ---------------------------------------------------------------------------
  test('GET /crypto/:cryptoId/ohlc with invalid param should return 400', async () => {
    const res = await request(app).get('/crypto/abc/ohlc');
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ error: 'Invalid crypto ID' });
  });

  test('GET /crypto/:cryptoId/ohlc success returns array', async () => {
    const msnodesqlv8 = require('msnodesqlv8');
    msnodesqlv8.open.mockImplementationOnce((connStr, cb) => {
      const mockConn = {
        query: (sql, params, done) => {
          const ohlcData = [{ CryptoID: 123, Symbol: 'TST' }];
          done(null, ohlcData);
        },
        close: jest.fn()
      };
      cb(null, mockConn);
    });

    const res = await request(app).get('/crypto/123/ohlc');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ CryptoID: 123 });
  });

  // ---------------------------------------------------------------------------
  // POST '/signup'
  // ---------------------------------------------------------------------------
  test('POST /signup missing body should return 400', async () => {
    const res = await request(app).post('/signup').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /signup success should return 201', async () => {
    // On simule une insertion OK
    const res = await request(app)
      .post('/signup')
      .send({ username: 'john', password: '123', email: 'john@example.com' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ message: 'User registered successfully.' });
  });

  // ---------------------------------------------------------------------------
  // POST '/login'
  // ---------------------------------------------------------------------------
  test('POST /login missing body => 400', async () => {
    const res = await request(app).post('/login').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /login invalid user => 400', async () => {
    // On simule un user introuvable en renvoyant []
    const msnodesqlv8 = require('msnodesqlv8');
    msnodesqlv8.open.mockImplementationOnce((connStr, cb) => {
      const mockConn = {
        query: (sql, params, done) => done(null, []),
        close: jest.fn()
      };
      cb(null, mockConn);
    });

    const res = await request(app)
      .post('/login')
      .send({ identifier: 'nouser', password: 'test' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ error: 'Invalid username/email or password.' });
  });

  test('POST /login valid => 200', async () => {
    // On simule un user => la route essaiera de faire un bcrypt.compare => 
    // Mais on ne mock pas bcrypt => par défaut, compare doit retourner true si 
    // on simule un PasswordHash cohérent. On peut le mocker ou on peut forcer la route 
    // en renvoyant un user.
    const msnodesqlv8 = require('msnodesqlv8');
    msnodesqlv8.open.mockImplementationOnce((connStr, cb) => {
      const mockConn = {
        query: (sql, params, done) => {
          const row = [
            { 
              UserID: 1, 
              Username: 'john', 
              PasswordHash: '$2b$10$abcdefghijklmnopqrstuv' // Faux, mais passable
            }
          ];
          done(null, row);
        },
        close: jest.fn()
      };
      cb(null, mockConn);
    });

    // On mock bcrypt.compare pour renvoyer true
    const bcrypt = require('bcrypt');
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/login')
      .send({ identifier: 'john', password: '123' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Login successful.');
    expect(res.body).toHaveProperty('userID', 1);
    // Vérifier qu'on a bien un Set-Cookie
    expect(res.headers['set-cookie']).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // GET '/check' (token nécessaire)
  // ---------------------------------------------------------------------------
  test('GET /check no token => 401', async () => {
    const res = await request(app).get('/check');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Unauthorized');
  });

  test('GET /check invalid token => 401', async () => {
    const res = await request(app)
      .get('/check')
      .set('Cookie', [`token=${INVALID_TOKEN}`]);
    expect(res.statusCode).toBe(401);
  });

  test('GET /check valid token => 200 + user info', async () => {
    const res = await request(app)
      .get('/check')
      .set('Cookie', [`token=${VALID_TOKEN}`]);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      isAuthenticated: true,
      username: 'TestUser'
    });
  });

  // ---------------------------------------------------------------------------
  // POST /logout
  // ---------------------------------------------------------------------------
  test('POST /logout => 200 + cleared cookie', async () => {
    const res = await request(app).post('/logout');
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ message: 'Logged out successfully' });
  });

  // ---------------------------------------------------------------------------
  // POST /favorites (token nécessaire)
  // ---------------------------------------------------------------------------
  test('POST /favorites no token => 401', async () => {
    const res = await request(app).post('/favorites').send({ cryptoId: 1 });
    expect(res.statusCode).toBe(401);
  });

  test('POST /favorites no cryptoId => 400', async () => {
    const res = await request(app)
      .post('/favorites')
      .set('Cookie', [`token=${VALID_TOKEN}`])
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /favorites success => 201', async () => {
    // Simule la récup de userID => insertion OK
    const msnodesqlv8 = require('msnodesqlv8');
    msnodesqlv8.open.mockImplementationOnce((connStr, cb) => {
      const mockConn = {
        query: (sql, params, done) => {
          // 1er query => SELECT userID => renvoie [{ UserID: 1 }]
          // 2e query => INSERT => success
          if (sql.includes('SELECT UserID')) {
            done(null, [{ UserID: 1 }]);
          } else {
            done(null, []);
          }
        },
        close: jest.fn()
      };
      cb(null, mockConn);
    });

    const res = await request(app)
      .post('/favorites')
      .set('Cookie', [`token=${VALID_TOKEN}`])
      .send({ cryptoId: 2 });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'Added to favorites.');
  });

  // ---------------------------------------------------------------------------
  // GET /favorites
  // ---------------------------------------------------------------------------
  test('GET /favorites no token => 401', async () => {
    const res = await request(app).get('/favorites');
    expect(res.statusCode).toBe(401);
  });

  test('GET /favorites success => array', async () => {
    // Simule fetch favorites
    const msnodesqlv8 = require('msnodesqlv8');
    msnodesqlv8.open.mockImplementationOnce((connStr, cb) => {
      const mockConn = {
        query: (sql, params, done) => {
          // 1er query => SELECT userID => renvoie [{ UserID: 1 }]
          // 2e query => renvoie l'ensemble des favorites
          if (sql.includes('SELECT UserID')) {
            done(null, [{ UserID: 1 }]);
          } else {
            done(null, [{ CryptoID: 2, Symbol: 'FAKE' }]);
          }
        },
        close: jest.fn()
      };
      cb(null, mockConn);
    });

    const res = await request(app)
      .get('/favorites')
      .set('Cookie', [`token=${VALID_TOKEN}`]);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // DELETE /favorites/:cryptoID
  // ---------------------------------------------------------------------------
  test('DELETE /favorites/:cryptoID no token => 401', async () => {
    const res = await request(app).delete('/favorites/2');
    expect(res.statusCode).toBe(401);
  });

  test('DELETE /favorites/:cryptoID success => 200', async () => {
    const msnodesqlv8 = require('msnodesqlv8');
    msnodesqlv8.open.mockImplementationOnce((connStr, cb) => {
      const mockConn = {
        query: (sql, params, done) => done(null, []),
        close: jest.fn()
      };
      cb(null, mockConn);
    });

    const res = await request(app)
      .delete('/favorites/2')
      .set('Cookie', [`token=${VALID_TOKEN}`]);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Removed from favorites.');
  });

  // ---------------------------------------------------------------------------
  // POST /alerts
  // ---------------------------------------------------------------------------
  test('POST /alerts no token => 401', async () => {
    const res = await request(app).post('/alerts').send({ cryptoId: 1, targetPrice: 100 });
    expect(res.statusCode).toBe(401);
  });

  test('POST /alerts invalid body => 400', async () => {
    const res = await request(app)
      .post('/alerts')
      .set('Cookie', [`token=${VALID_TOKEN}`])
      .send({ cryptoId: 1 }); // missing targetPrice
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /alerts success => 201', async () => {
    // Mock DB => SELECT user => Insert => OK
    const msnodesqlv8 = require('msnodesqlv8');
    msnodesqlv8.open.mockImplementationOnce((connStr, cb) => {
      const mockConn = {
        query: (sql, params, done) => {
          if (sql.includes('SELECT UserID')) {
            done(null, [{ UserID: 1 }]);
          } else {
            done(null, []);
          }
        },
        close: jest.fn()
      };
      cb(null, mockConn);
    });

    const res = await request(app)
      .post('/alerts')
      .set('Cookie', [`token=${VALID_TOKEN}`])
      .send({ cryptoId: 1, targetPrice: 100 });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'Alert created successfully.');
  });

  // ---------------------------------------------------------------------------
  // GET /alerts
  // ---------------------------------------------------------------------------
  test('GET /alerts no token => 401', async () => {
    const res = await request(app).get('/alerts');
    expect(res.statusCode).toBe(401);
  });

  test('GET /alerts success => array', async () => {
    const msnodesqlv8 = require('msnodesqlv8');
    msnodesqlv8.open.mockImplementationOnce((connStr, cb) => {
      const mockConn = {
        query: (sql, params, done) => {
          if (sql.includes('SELECT UserID')) {
            done(null, [{ UserID: 1 }]);
          } else {
            done(null, [{ AlertID: 1, CryptoID: 1 }]);
          }
        },
        close: jest.fn()
      };
      cb(null, mockConn);
    });

    const res = await request(app)
      .get('/alerts')
      .set('Cookie', [`token=${VALID_TOKEN}`]);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('AlertID', 1);
  });

});

