import pyodbc
import requests
import time
from datetime import datetime

# Configuration de la connexion
server = 'localhost'
database = 'cryptoDB'

conn = pyodbc.connect(
    f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};Trusted_Connection=yes;"
)
cursor = conn.cursor()

# Create tables if not exists
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
            CollectionTime DATETIME NOT NULL
        )
        """)
        conn.commit()
        print("Tables created successfully.")
    except Exception as e:
        print(f"Error creating tables: {e}")

# Get or create CryptoID for a cryptocurrency
def get_or_create_crypto_id(symbol, name):
    try:
        # Check if the crypto already exists
        cursor.execute("SELECT CryptoID FROM CryptoMapping WHERE Symbol = ?", (symbol,))
        row = cursor.fetchone()
        if row:
            return row.CryptoID

        # If not exists, insert it into CryptoMapping
        cursor.execute("INSERT INTO CryptoMapping (Symbol, Name) VALUES (?, ?)", (symbol, name))
        conn.commit()

        # Get the newly created CryptoID
        return cursor.execute("SELECT CryptoID FROM CryptoMapping WHERE Symbol = ?", (symbol,)).fetchone().CryptoID
    except Exception as e:
        print(f"Error in get_or_create_crypto_id: {e}")
        return None

# Collect and store data
def collect_data():
    url = "https://api.coincap.io/v2/assets"
    try:
        response = requests.get(url)
        response.raise_for_status()
        cryptos = response.json()["data"]  # Get the list of cryptocurrencies

        for crypto in cryptos:
            symbol = crypto["symbol"]
            name = crypto["name"]
            price_usd = float(crypto["priceUsd"])
            volume_usd = float(crypto["volumeUsd24Hr"])
            collection_time = datetime.now()

            # Get or create the CryptoID
            crypto_id = get_or_create_crypto_id(symbol, name)

            # Insert data into CryptoData table
            cursor.execute("""
            INSERT INTO CryptoData (CryptoID, Name, Symbol, PriceUSD, VolumeUSD, CollectionTime) 
            VALUES (?, ?, ?, ?, ?, ?)""", (crypto_id, name, symbol, price_usd, volume_usd, collection_time))
        conn.commit()
        print(f"Data inserted for {len(cryptos)} cryptocurrencies.")
    except Exception as e:
        print(f"Error in collect_data: {e}")

if __name__ == "__main__":
    # Create tables
    create_tables()

    # Collect data periodically
    try:
        while True:
            collect_data()
            time.sleep(20)  # Pause for 20 seconds
    except KeyboardInterrupt:
        print("Stopping the script.")
    finally:
        conn.close()
