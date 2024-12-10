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

# Fonction pour créer la table
def create_table():
    try:
        cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CryptoData' AND xtype='U')
        CREATE TABLE CryptoData (
            ID INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(50) NOT NULL,
            Symbol NVARCHAR(10) NOT NULL,
            PriceUSD FLOAT NOT NULL,
            VolumeUSD FLOAT NOT NULL,
            CollectionTime DATETIME NOT NULL
        )
        """)
        conn.commit()
        print("Table 'CryptoData' créée avec succès.")
    except Exception as e:
        print(f"Erreur lors de la création de la table : {e}")

# Fonction pour collecter les données
def collect_data():
    url = "https://api.coincap.io/v2/assets"
    try:
        response = requests.get(url)
        response.raise_for_status()
        cryptos = response.json()["data"]  # Get the list of cryptocurrencies

        for crypto in cryptos:
            name = crypto["name"]
            symbol = crypto["symbol"]
            price_usd = float(crypto["priceUsd"])
            volume_usd = float(crypto["volumeUsd24Hr"])
            collection_time = datetime.now()  # Get the current timestamp

            # Insertion dans la base de données
            cursor.execute("""
            INSERT INTO CryptoData (Name, Symbol, PriceUSD, VolumeUSD, CollectionTime) 
            VALUES (?, ?, ?, ?, ?)""", (name, symbol, price_usd, volume_usd, collection_time))
        conn.commit()
        print(f"Données insérées pour {len(cryptos)} cryptomonnaies.")
    except Exception as e:
        print(f"Erreur : {e}")

if __name__ == "__main__":
    # Création de la table
    create_table()

    # Boucle de collecte périodique
    try:
        while True:
            collect_data()
            time.sleep(20)  # Pause de 20 secondes
    except KeyboardInterrupt:
        print("Arrêt du programme.")
    finally:
        conn.close()