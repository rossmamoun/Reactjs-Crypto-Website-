import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
            navigate('/'); // Redirect to the home page on success
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to log in.');
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-base-200">
            <div className="card w-96 bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title text-center">Log In</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Username or Email:</span>
                            </label>
                            <input
                                type="text"
                                name="identifier"
                                onChange={handleChange}
                                placeholder="Enter your username or email"
                                className="input input-bordered"
                                required
                            />
                        </div>
                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Password:</span>
                            </label>
                            <input
                                type="password"
                                name="password"
                                onChange={handleChange}
                                placeholder="Enter your password"
                                className="input input-bordered"
                                required
                            />
                        </div>
                        <div className="form-control mt-6">
                            <button type="submit" className="btn btn-primary">
                                Log In
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
