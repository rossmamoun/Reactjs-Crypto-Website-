// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CryptoList from './components/CryptoList';
import CryptoDetail from './components/CryptoDetail';
import CandlestickChart from './components/CandlestickChart'; 
import Navbar from './components/Navbar';
import SignUp from './components/SignUp';
import LogIn from './components/LogIn';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <div className="content-container">
          <Sidebar />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<CryptoList />} />
              <Route path="/crypto/:cryptoId" element={<CryptoDetail />} /> 
              <Route path="/crypto/:cryptoId/candlestick" element={<CandlestickChart />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<LogIn />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
