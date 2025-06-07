import { createContext, useContext, useState, useEffect } from 'react';
import { isAuthenticated, logoutUser } from '../api/authApi';

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
        setIsLoggedIn(isAuthenticated());
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);