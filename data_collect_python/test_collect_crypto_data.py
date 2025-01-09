import unittest
from unittest.mock import patch, MagicMock, call
import requests
from datetime import datetime
import io
from contextlib import redirect_stdout

# On importe le module principal (assure-toi que le nom de fichier est correct)
import collect_crypto_data

class TestCollectCryptoData(unittest.TestCase):
    # -------------------------------------------------------------------------
    # create_tables
    # -------------------------------------------------------------------------
    @patch('collect_crypto_data.conn')
    @patch('collect_crypto_data.cursor')
    def test_create_tables_success(self, mock_cursor, mock_conn):
        f = io.StringIO()
        with redirect_stdout(f):
            collect_crypto_data.create_tables()
        output = f.getvalue()
        # Vérification basique
        self.assertIn("Tables created successfully.", output)
        self.assertTrue(mock_cursor.execute.called)
        self.assertTrue(mock_conn.commit.called)

    @patch('collect_crypto_data.conn')
    @patch('collect_crypto_data.cursor')
    def test_create_tables_exception(self, mock_cursor, mock_conn):
        mock_cursor.execute.side_effect = Exception("Test exception in create_tables")
        f = io.StringIO()
        with redirect_stdout(f):
            collect_crypto_data.create_tables()
        output = f.getvalue()
        self.assertIn("Error creating tables: Test exception in create_tables", output)

    # -------------------------------------------------------------------------
    # get_or_create_crypto_id
    # -------------------------------------------------------------------------
    @patch('collect_crypto_data.conn')
    @patch('collect_crypto_data.cursor')
    def test_get_or_create_crypto_id_existing(self, mock_cursor, mock_conn):
        mock_cursor.fetchone.return_value = MagicMock(CryptoID=42)
        result = collect_crypto_data.get_or_create_crypto_id("BTC", "Bitcoin")
        self.assertEqual(result, 42)
        mock_cursor.execute.assert_called_with(
            "SELECT CryptoID FROM CryptoMapping WHERE Symbol = ?", ("BTC",)
        )

    @patch('collect_crypto_data.conn')
    @patch('collect_crypto_data.cursor')
    def test_get_or_create_crypto_id_new(self, mock_cursor, mock_conn):
        """
        Symbol n'existe pas => SELECT => None
        Puis on INSERT => et on refait SELECT => CryptoID=999
        """
        # fetchone() : 1er appel => None (pas trouvé)
        #              2e appel => renvoie un objet simulé avec CryptoID=999
        mock_cursor.fetchone.side_effect = [
            None,
            MagicMock(CryptoID=999)
        ]
        # .execute est appelé 3 fois (SELECT, INSERT, SELECT)
        mock_cursor.execute.side_effect = [None, None, None]

        result = collect_crypto_data.get_or_create_crypto_id("NEW", "NewCoin")
        self.assertEqual(result, 999)

        # Vérif qu'on a bien fait un SELECT, puis un INSERT, puis un SELECT
        self.assertEqual(mock_cursor.execute.call_args_list, [
            call("SELECT CryptoID FROM CryptoMapping WHERE Symbol = ?", ("NEW",)),
            call("INSERT INTO CryptoMapping (Symbol, Name) VALUES (?, ?)", ("NEW", "NewCoin")),
            call("SELECT CryptoID FROM CryptoMapping WHERE Symbol = ?", ("NEW",))
        ])

    @patch('collect_crypto_data.conn')
    @patch('collect_crypto_data.cursor')
    def test_get_or_create_crypto_id_exception(self, mock_cursor, mock_conn):
        mock_cursor.execute.side_effect = Exception("Test exception in get_or_create_crypto_id")
        f = io.StringIO()
        with redirect_stdout(f):
            result = collect_crypto_data.get_or_create_crypto_id("ANY", "AnyCoin")
        output = f.getvalue()
        self.assertIsNone(result)
        self.assertIn("Error in get_or_create_crypto_id: Test exception in get_or_create_crypto_id", output)

    # -------------------------------------------------------------------------
    # collect_data
    # -------------------------------------------------------------------------
    @patch('collect_crypto_data.get_or_create_crypto_id', return_value=1)
    @patch('collect_crypto_data.requests.get')
    @patch('collect_crypto_data.conn')
    @patch('collect_crypto_data.cursor')
    def test_collect_data_success(self, mock_cursor, mock_conn, mock_get, mock_get_or_create_id):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "data": [
                {"symbol": "BTC", "name": "Bitcoin", "priceUsd": "50000", "volumeUsd24Hr": "1000000"}
            ]
        }
        mock_get.return_value = mock_response

        f = io.StringIO()
        with redirect_stdout(f):
            collect_crypto_data.collect_data()
        output = f.getvalue()
        self.assertIn("Data inserted for 1 cryptocurrencies.", output)
        mock_cursor.execute.assert_called_with(
            """
            INSERT INTO CryptoData (CryptoID, Name, Symbol, PriceUSD, VolumeUSD, CollectionTime) 
            VALUES (?, ?, ?, ?, ?, ?)""",
            (1, 'Bitcoin', 'BTC', 50000.0, 1000000.0, mock_cursor.execute.call_args[0][1][5])
        )

    @patch('collect_crypto_data.requests.get')
    @patch('collect_crypto_data.conn')
    @patch('collect_crypto_data.cursor')
    def test_collect_data_exception(self, mock_cursor, mock_conn, mock_get):
        mock_get.side_effect = requests.exceptions.RequestException("Test exception in collect_data")
        f = io.StringIO()
        with redirect_stdout(f):
            collect_crypto_data.collect_data()
        output = f.getvalue()
        self.assertIn("Error in collect_data: Test exception in collect_data", output)

    # -------------------------------------------------------------------------
    # fetch_and_store_all_ohlc
    # -------------------------------------------------------------------------
    @patch('collect_crypto_data.conn')
    @patch('collect_crypto_data.cursor')
    @patch('collect_crypto_data.requests.get')
    def test_fetch_and_store_all_ohlc_success(self, mock_get, mock_cursor, mock_conn):
        """
        On veut simuler l'INSERT (et donc 'Inserted OHLC data...')
        => on fixe fetchone() = (0,) pour faire passer "if not exists" == True
        """
        # Simule 1 crypto dans CryptoMapping
        mock_cursor.fetchall.return_value = [
            MagicMock(CryptoID=1, Symbol='BTC')
        ]
        # "exists" = 0 => on doit faire un INSERT
        mock_cursor.fetchone.return_value = (0,)

        # Réponse simulée de l'API
        mock_response = MagicMock()
        mock_response.json.return_value = [
            [1609459200000, "29000.0", "29500.0", "28500.0", "29000.0", "1000.0"]
        ]
        mock_get.return_value = mock_response

        f = io.StringIO()
        with redirect_stdout(f):
            collect_crypto_data.fetch_and_store_all_ohlc()
        output = f.getvalue()

        # On vérifie que "Inserted OHLC data..." et "OHLC data updated..." apparaissent
        self.assertIn("Inserted OHLC data for BTC at 2021-01-01 00:00:00", output)
        self.assertIn("OHLC data updated for BTC", output)

    @patch('collect_crypto_data.conn')
    @patch('collect_crypto_data.cursor')
    @patch('collect_crypto_data.requests.get')
    def test_fetch_and_store_all_ohlc_exception_request(self, mock_get, mock_cursor, mock_conn):
        mock_cursor.fetchall.return_value = [
            MagicMock(CryptoID=1, Symbol='BTC')
        ]
        mock_get.side_effect = requests.exceptions.RequestException("Test exception in fetch_and_store_all_ohlc")

        f = io.StringIO()
        with redirect_stdout(f):
            collect_crypto_data.fetch_and_store_all_ohlc()
        output = f.getvalue()
        self.assertIn("Error fetching OHLC data for BTC: Test exception in fetch_and_store_all_ohlc", output)

    @patch('collect_crypto_data.conn')
    @patch('collect_crypto_data.cursor')
    def test_fetch_and_store_all_ohlc_exception_fetch(self, mock_cursor, mock_conn):
        mock_cursor.execute.side_effect = Exception("Test global exception in fetch_and_store_all_ohlc")
        f = io.StringIO()
        with redirect_stdout(f):
            collect_crypto_data.fetch_and_store_all_ohlc()
        output = f.getvalue()
        self.assertIn("Error fetching all OHLC data: Test global exception in fetch_and_store_all_ohlc", output)

    # -------------------------------------------------------------------------
    # Test de la boucle principale
    # -------------------------------------------------------------------------
    @patch('collect_crypto_data.conn')
    @patch('collect_crypto_data.create_tables')
    @patch('collect_crypto_data.collect_data')
    @patch('collect_crypto_data.fetch_and_store_all_ohlc')
    @patch('collect_crypto_data.time.sleep', side_effect=KeyboardInterrupt("Stopped for test"))
    def test_main_loop(self, mock_sleep, mock_fetch, mock_collect, mock_create, mock_conn):
        """
        Teste la fonction main_loop() qui contient la boucle infinie.
        On simule un KeyboardInterrupt pour vérifier le finally: conn.close().
        """
        f = io.StringIO()
        with self.assertRaises(KeyboardInterrupt):
            with redirect_stdout(f):
                collect_crypto_data.main_loop()

        output = f.getvalue()
        self.assertIn("Waiting for the next interval...", output)
        self.assertIn("Stopping the script.", output)
        # On vérifie que la connexion est fermée
        self.assertTrue(mock_conn.close.called)


if __name__ == '__main__':
    unittest.main()
