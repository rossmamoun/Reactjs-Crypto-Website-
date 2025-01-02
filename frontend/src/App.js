// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CryptoList from './components/CryptoList';
import CryptoDetail from './components/CryptoDetail';
import CandlestickChart from './components/CandlestickChart'; 
import Navbar from './components/Navbar';
import SignUp from './components/SignUp';
import LogIn from './components/LogIn';
import './App.css';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<CryptoList />} />
        <Route path="/crypto/:cryptoId" element={<CryptoDetail />} /> 
        <Route path="/crypto/:cryptoId/candlestick" element={<CandlestickChart />} />{/* Define route for detailed view */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<LogIn />} />

      </Routes>
    </Router>
  );
}

export default App;