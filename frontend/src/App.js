// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CryptoList from './components/CryptoList';
import CryptoDetail from './components/CryptoDetail';
import CandlestickChart from './components/CandlestickChart'; // Import the CryptoDetail component
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CryptoList />} />
        <Route path="/crypto/:cryptoId" element={<CryptoDetail />} /> 
        <Route path="/crypto/:cryptoId/candlestick" element={<CandlestickChart />} />{/* Define route for detailed view */}
      </Routes>
    </Router>
  );
}

export default App;