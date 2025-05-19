// src/components/Navigation.jsx
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import '../styles/navigation.css';

function Navigation() {
    const { isLoggedIn, logout } = useAuth();

    return (
        <nav className="main-nav">
            <div className="nav-brand">
                <Link to="/">The Card</Link>
            </div>

            <div className="nav-links">
                {isLoggedIn ? (
                    <>
                        <Link to="/" className="nav-link">Scorecard</Link>
                        <Link to="/rounds" className="nav-link">My Rounds</Link>
                        <Link to="/admin" className="nav-link">Admin</Link>
                        <button
                            onClick={logout}
                            className="logout-button"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-link">Login</Link>
                        <Link to="/signup" className="nav-link">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navigation;