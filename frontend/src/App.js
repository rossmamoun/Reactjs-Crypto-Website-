import React from 'react';
import './App.css';
import CryptoList from './components/CryptoList';  // Import the CryptoList component

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Crypto Data</h1>
        <CryptoList />  {/* Render the CryptoList component */}
      </header>
    </div>
  );
}

export default App;
