import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Login = () => {
    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/login', formData, {
                withCredentials: true, // Include cookies in requests
            });
            alert(response.data.message);
            navigate('/');
        } catch (err) {
            alert(err.response.data.error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>Username or Email:</label>
            <input type="text" name="identifier" onChange={handleChange} required />
            <label>Password:</label>
            <input type="password" name="password" onChange={handleChange} required />
            <button type="submit">Log In</button>
        </form>
    );
};

export default Login;
