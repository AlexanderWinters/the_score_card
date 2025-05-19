// src/components/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { isAuthenticated, getAuthToken, logoutUser } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());

    const login = (token) => {
        localStorage.setItem('authToken', token);
        setIsLoggedIn(true);
    };

    const logout = () => {
        logoutUser();
        setIsLoggedIn(false);
    };

    useEffect(() => {
        // Check if the token exists on app load
        setIsLoggedIn(isAuthenticated());
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);