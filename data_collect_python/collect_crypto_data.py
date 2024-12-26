import pyodbc
import requests
import time
from datetime import datetime

# Configuration for the database connection
server = 'localhost'
database = 'cryptoDB'

conn = pyodbc.connect(
    f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};Trusted_Connection=yes;"
)
cursor = conn.cursor()

# Create tables with foreign keys
def create_tables():
    try:
        # Create CryptoMapping table
        cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CryptoMapping' AND xtype='U')
        CREATE TABLE CryptoMapping (
            CryptoID INT IDENTITY(1,1) PRIMARY KEY,
            Symbol NVARCHAR(10) UNIQUE NOT NULL,
            Name NVARCHAR(50) NOT NULL
        )
        """)
        conn.commit()

        # Create CryptoData table
        cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CryptoData' AND xtype='U')
        CREATE TABLE CryptoData (
            ID INT IDENTITY(1,1) PRIMARY KEY,
            CryptoID INT NOT NULL,
            Name NVARCHAR(50) NOT NULL,
            Symbol NVARCHAR(10) NOT NULL,
            PriceUSD FLOAT NOT NULL,
            VolumeUSD FLOAT NOT NULL,
            CollectionTime DATETIME NOT NULL,
            FOREIGN KEY (CryptoID) REFERENCES CryptoMapping(CryptoID)
        )
        """)
        conn.commit()

        # Create CryptoOHLC table
        cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CryptoOHLC' AND xtype='U')
        CREATE TABLE CryptoOHLC (
            OHLCID INT IDENTITY(1,1) PRIMARY KEY,
            CryptoID INT NOT NULL,
            Symbol NVARCHAR(10) NOT NULL,
            [Open] FLOAT NOT NULL,
            High FLOAT NOT NULL,
            Low FLOAT NOT NULL,
            [Close] FLOAT NOT NULL,
            Volume FLOAT,
            TimeframeStart DATETIME NOT NULL,
            FOREIGN KEY (CryptoID) REFERENCES CryptoMapping(CryptoID),
            FOREIGN KEY (Symbol) REFERENCES CryptoMapping(Symbol)
        )
        """)
        conn.commit()

        print("Tables created successfully.")
    except Exception as e:
        print(f"Error creating tables: {e}")

# Get or create CryptoID for a cryptocurrency
def get_or_create_crypto_id(symbol, name):
    try:
        cursor.execute("SELECT CryptoID FROM CryptoMapping WHERE Symbol = ?", (symbol,))
        row = cursor.fetchone()
        if row:
            return row.CryptoID

        cursor.execute("INSERT INTO CryptoMapping (Symbol, Name) VALUES (?, ?)", (symbol, name))
        conn.commit()

        return cursor.execute("SELECT CryptoID FROM CryptoMapping WHERE Symbol = ?", (symbol,)).fetchone().CryptoID
    except Exception as e:
        print(f"Error in get_or_create_crypto_id: {e}")
        return None

# Collect and store general crypto data
def collect_data():
    url = "https://api.coincap.io/v2/assets"
    try:
        response = requests.get(url)
        response.raise_for_status()
        cryptos = response.json()["data"]

        for crypto in cryptos:
            symbol = crypto["symbol"]
            name = crypto["name"]
            price_usd = float(crypto["priceUsd"])
            volume_usd = float(crypto["volumeUsd24Hr"])
            collection_time = datetime.now()

            crypto_id = get_or_create_crypto_id(symbol, name)

            cursor.execute("""
            INSERT INTO CryptoData (CryptoID, Name, Symbol, PriceUSD, VolumeUSD, CollectionTime) 
            VALUES (?, ?, ?, ?, ?, ?)""", (crypto_id, name, symbol, price_usd, volume_usd, collection_time))
        conn.commit()
        print(f"Data inserted for {len(cryptos)} cryptocurrencies.")
    except Exception as e:
        print(f"Error in collect_data: {e}")

# Fetch and store OHLC data using Binance API
def fetch_and_store_all_ohlc():
    try:
        cursor.execute("SELECT CryptoID, Symbol FROM CryptoMapping")
        cryptos = cursor.fetchall()

        for crypto in cryptos:
            crypto_id = crypto.CryptoID
            symbol = crypto.Symbol
            pair = f"{symbol}USDT"

            url = "https://api.binance.com/api/v3/klines"
            params = {
                "symbol": pair,
                "interval": "1m",  # interval
                "limit": 10       # Fetch last 10 candles
            }

            try:
                response = requests.get(url, params=params)
                response.raise_for_status()
                ohlc_data = response.json()

                for entry in ohlc_data:
                    timeframe_start = datetime.fromtimestamp(entry[0] / 1000)
                    open_price = float(entry[1])
                    high_price = float(entry[2])
                    low_price = float(entry[3])
                    close_price = float(entry[4])
                    volume = float(entry[5])

                    cursor.execute("""
                        SELECT COUNT(*) 
                        FROM CryptoOHLC 
                        WHERE CryptoID = ? AND TimeframeStart = ?
                    """, (crypto_id, timeframe_start))
                    exists = cursor.fetchone()[0]

                    if not exists:
                        cursor.execute("""
                            INSERT INTO CryptoOHLC (CryptoID, Symbol, [Open], High, Low, [Close], Volume, TimeframeStart)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """, (crypto_id, symbol, open_price, high_price, low_price, close_price, volume, timeframe_start))
                        print(f"Inserted OHLC data for {symbol} at {timeframe_start}")

                conn.commit()
                print(f"OHLC data updated for {symbol}")

            except Exception as e:
                print(f"Error fetching OHLC data for {symbol}: {e}")

    except Exception as e:
        print(f"Error fetching all OHLC data: {e}")

if __name__ == "__main__":
    create_tables()

    try:
        while True:
            collect_data()
            fetch_and_store_all_ohlc()
            print("Waiting for the next interval...")
            time.sleep(120)
    except KeyboardInterrupt:
        print("Stopping the script.")
    finally:
        conn.close()
