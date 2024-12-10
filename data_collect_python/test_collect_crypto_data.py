import pytest
from unittest.mock import patch, MagicMock
from collect_crypto_data import create_table, collect_data, conn, cursor
from datetime import datetime
import requests

def test_create_table():
    with patch('collect_crypto_data.cursor') as mock_cursor:
        mock_cursor.execute.side_effect = Exception("Test Exception")
        create_table()
        mock_cursor.execute.assert_called_once()
        mock_cursor.execute.side_effect = None

def test_collect_data_success():
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "data": [
            {
                "name": "Bitcoin",
                "symbol": "BTC",
                "priceUsd": "60000",
                "volumeUsd24Hr": "1000000000"
            }
        ]
    }
    
    with patch('collect_crypto_data.requests.get') as mock_get, \
         patch('collect_crypto_data.datetime') as mock_datetime, \
         patch('collect_crypto_data.cursor') as mock_cursor:
        
        mock_get.return_value = mock_response
        mock_datetime.now.return_value = datetime(2024, 11, 20, 9, 46, 29)
        
        collect_data()
        
        mock_get.assert_called_once_with("https://api.coincap.io/v2/assets")
        expected_query = """
            INSERT INTO CryptoData (Name, Symbol, PriceUSD, VolumeUSD, CollectionTime) 
            VALUES (?, ?, ?, ?, ?)
        """.strip()
        mock_cursor.execute.assert_called_once_with(
            expected_query,
            ("Bitcoin", "BTC", 60000.0, 1000000000.0, datetime(2024, 11, 20, 9, 46, 29))
        )

def test_collect_data_exception():
    with patch('collect_crypto_data.requests.get') as mock_get:
        mock_get.side_effect = Exception("Test Exception")
        collect_data()
        mock_get.assert_called_once_with("https://api.coincap.io/v2/assets")

def test_collect_data_insert_exception():
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "data": [
            {
                "name": "Bitcoin",
                "symbol": "BTC",
                "priceUsd": "60000",
                "volumeUsd24Hr": "1000000000"
            }
        ]
    }
    
    with patch('collect_crypto_data.requests.get') as mock_get, \
         patch('collect_crypto_data.cursor') as mock_cursor:
        
        mock_get.return_value = mock_response
        mock_cursor.execute.side_effect = Exception("Test Exception")
        
        collect_data()
        
        mock_get.assert_called_once_with("https://api.coincap.io/v2/assets")
        mock_cursor.execute.assert_called_once()

@pytest.fixture(scope="module", autouse=True)
def teardown():
    yield
    conn.close()