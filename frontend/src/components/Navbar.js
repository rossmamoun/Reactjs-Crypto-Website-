import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Create a CSS file for styling if needed

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-title">
        <Link to="/">Crypto Dashboard</Link>
      </div>
      <div className="navbar-links">
        <Link to="/signup">Sign Up</Link>
        <Link to="/login">Log In</Link>
      </div>
    </nav>
  );
};

export default Navbar;
