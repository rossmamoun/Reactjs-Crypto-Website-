import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Navbar.css';

const Navbar = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Auth state
    const [username, setUsername] = useState(''); // Store the username
    const navigate = useNavigate();

    // Check authentication status when the component mounts
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get('http://localhost:5000/check', { withCredentials: true });
                setIsAuthenticated(true); // If `/check` succeeds, the user is authenticated
                setUsername(response.data.username); // Set the username from the response
            } catch (err) {
                setIsAuthenticated(false); // If `/check` fails, the user is not authenticated
            }
        };

        checkAuth();
    }, []);

    // Logout handler
    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:5000/logout', {}, { withCredentials: true });
            setIsAuthenticated(false);
            setUsername('');
            navigate('/'); // Redirect to the home page
        } catch (err) {
            alert('Failed to log out');
        }
    };

    return (
        <nav>
            <div className="navbar-left">
                <Link to="/">Crypto Tracker</Link>
            </div>
            <div className="navbar-right">
                {isAuthenticated ? (
                    <>
                        <span>Welcome, {username}!</span>
                        <button onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/signup">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
