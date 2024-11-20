import unittest
from unittest.mock import patch, MagicMock
import pyodbc
from datetime import datetime
import requests
from collect_crypto_data import create_table, collect_data

class TestCryptoDataCollection(unittest.TestCase):

    @patch('pyodbc.connect')
    def test_create_table(self, mock_connect):
        # Mock de la connexion à la base de données
        mock_cursor = MagicMock()
        mock_connect.return_value.cursor.return_value = mock_cursor
        
        # Appeler la fonction create_table
        create_table()

        # Vérifier si la requête CREATE TABLE a été exécutée
        mock_cursor.execute.assert_called_once_with("""
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CryptoData' AND xtype='U')
        CREATE TABLE CryptoData (
            ID INT IDENTITY(1,1) PRIMARY KEY,
            Name NVARCHAR(50) NOT NULL,
            Symbol NVARCHAR(10) NOT NULL,
            PriceUSD FLOAT NOT NULL,
            VolumeUSD FLOAT NOT NULL,
            CollectionTime DATETIME NOT NULL
        )""")
        mock_connect.return_value.commit.assert_called_once()

    @patch('requests.get')
    @patch('pyodbc.connect')
    def test_collect_data(self, mock_connect, mock_get):
        # Mock de la réponse de l'API
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "data": [{
                "name": "Bitcoin",
                "symbol": "BTC",
                "priceUsd": "50000.00",
                "volumeUsd24Hr": "1000000000"
            }]
        }
        mock_get.return_value = mock_response
        
        # Mock de la connexion à la base de données
        mock_cursor = MagicMock()
        mock_connect.return_value.cursor.return_value = mock_cursor
        
        # Capture datetime to ensure consistency in the assertion
        with patch.object(datetime, 'now', return_value=datetime(2024, 11, 20, 12, 0, 0)):
            # Appel de la fonction collect_data
            collect_data()

        # Vérifier si la requête d'insertion a été exécutée
        mock_cursor.execute.assert_called_once_with("""
        INSERT INTO CryptoData (Name, Symbol, PriceUSD, VolumeUSD, CollectionTime) 
        VALUES (?, ?, ?, ?, ?)""", 
        ('Bitcoin', 'BTC', 50000.0, 1000000000.0, datetime(2024, 11, 20, 12, 0, 0)))
        
        mock_connect.return_value.commit.assert_called_once()

    @patch('requests.get')
    def test_collect_data_error(self, mock_get):
        # Simuler une erreur lors de l'appel à l'API
        mock_get.side_effect = requests.exceptions.RequestException("API error")
        
        # Vérifier que l'erreur est bien gérée et affichée
        with self.assertRaises(requests.exceptions.RequestException):
            collect_data()

if __name__ == '__main__':
    unittest.main()
