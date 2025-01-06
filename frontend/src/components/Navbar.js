import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Navbar = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get('http://localhost:5000/check', { withCredentials: true });
                setIsAuthenticated(true);
                setUsername(response.data.username);
            } catch (err) {
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, [isAuthenticated]);

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:5000/logout', {}, { withCredentials: true });
            setIsAuthenticated(false);
            setUsername('');
            navigate('/');
        } catch (err) {
            alert('Failed to log out');
        }
    };

    return (
        <div className="navbar bg-base-100 shadow-lg">
            <div className="flex-1">
                <Link to="/" className="btn btn-ghost normal-case text-xl">
                    Crypto Tracker
                </Link>
            </div>
            <div className="flex-none">
                {isAuthenticated ? (
                    <>
                        <span className="mr-4">Welcome, {username}!</span>
                        <button className="btn btn-error" onClick={handleLogout}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="btn btn-primary mr-2">
                            Login
                        </Link>
                        <Link to="/signup" className="btn btn-secondary">
                            Sign Up
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default Navbar;
