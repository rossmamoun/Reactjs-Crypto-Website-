import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
    const [formData, setFormData] = useState({ identifier: '', password: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/login', formData);
            alert(response.data.message);
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
