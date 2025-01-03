import React, { useState } from 'react';
import axios from 'axios';

const Signup = () => {
    const [formData, setFormData] = useState({ 
        username: '', 
        email: '', 
        password: '' 
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/signup', formData, {
                withCredentials: true, // Include cookies in requests
            });
            alert(response.data.message);
        } catch (err) {
            alert(err.response.data.error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>Username:</label>
            <input type="text" name="username" onChange={handleChange} required />
            <label>Email:</label>
            <input type="email" name="email" onChange={handleChange} required />
            <label>Password:</label>
            <input type="password" name="password" onChange={handleChange} required />
            <button type="submit">Sign Up</button>
        </form>
    );
};

export default Signup;
