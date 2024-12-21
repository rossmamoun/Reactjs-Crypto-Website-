import pytest
from unittest.mock import patch, MagicMock
from collect_crypto_data import create_tables, collect_data, get_or_create_crypto_id, conn, cursor
from datetime import datetime


# Test for create_tables function
def test_create_tables():
    with patch('collect_crypto_data.cursor') as mock_cursor:
        mock_cursor.execute.side_effect = Exception("Test Exception")
        create_tables()
        mock_cursor.execute.assert_called()  # Check that execute was called
        mock_cursor.execute.side_effect = None


# Test for get_or_create_crypto_id function
def test_get_or_create_crypto_id():
    with patch('collect_crypto_data.cursor') as mock_cursor:
        # Simulate that the crypto does not exist
        mock_cursor.fetchone.return_value = None
        mock_cursor.execute.return_value = None

        # Call the function to insert a new crypto
        crypto_id = get_or_create_crypto_id("BTC", "Bitcoin")

        # Verify insert query was called for a new crypto
        mock_cursor.execute.assert_any_call(
            "INSERT INTO CryptoMapping (Symbol, Name) VALUES (?, ?)", ("BTC", "Bitcoin")
        )

        # Simulate fetching the newly inserted crypto_id
        mock_cursor.fetchone.return_value = MagicMock(CryptoID=1)
        mock_cursor.execute.assert_any_call(
            "SELECT CryptoID FROM CryptoMapping WHERE Symbol = ?", ("BTC",)
        )

        # Ensure it returns the correct crypto_id
        assert crypto_id == 1


# Test for collect_data function (success case)
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
         patch('collect_crypto_data.get_or_create_crypto_id') as mock_get_or_create_id, \
         patch('collect_crypto_data.cursor') as mock_cursor, \
         patch('collect_crypto_data.datetime') as mock_datetime:

        # Mock the response and timestamp
        mock_get.return_value = mock_response
        mock_get_or_create_id.return_value = 1
        mock_datetime.now.return_value = datetime(2024, 11, 20, 9, 46, 29)

        # Call the function
        collect_data()

        # Check if the API call was made
        mock_get.assert_called_once_with("https://api.coincap.io/v2/assets")

        # Verify the correct query was executed
        expected_query = """
            INSERT INTO CryptoData (CryptoID, Name, Symbol, PriceUSD, VolumeUSD, CollectionTime) 
            VALUES (?, ?, ?, ?, ?, ?)
        """.strip()
        mock_cursor.execute.assert_called_once_with(
            expected_query,
            (1, "Bitcoin", "BTC", 60000.0, 1000000000.0, datetime(2024, 11, 20, 9, 46, 29))
        )


# Test for collect_data function with API exception
def test_collect_data_api_exception():
    with patch('collect_crypto_data.requests.get') as mock_get:
        mock_get.side_effect = Exception("Test Exception")
        collect_data()
        mock_get.assert_called_once_with("https://api.coincap.io/v2/assets")


# Test for collect_data function with database insert exception
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
         patch('collect_crypto_data.get_or_create_crypto_id') as mock_get_or_create_id, \
         patch('collect_crypto_data.cursor') as mock_cursor:

        # Mock the API response and crypto_id lookup
        mock_get.return_value = mock_response
        mock_get_or_create_id.return_value = 1

        # Simulate an exception during database insert
        mock_cursor.execute.side_effect = Exception("Test Exception")

        # Call the function
        collect_data()

        # Verify the API was called
        mock_get.assert_called_once_with("https://api.coincap.io/v2/assets")

        # Check if the insert query was attempted
        mock_cursor.execute.assert_called()


# Fixture to clean up database connection
@pytest.fixture(scope="module", autouse=True)
def teardown():
    yield
    conn.close()
