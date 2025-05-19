// src/components/SignupPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateUserKey, registerUser } from '../api/authApi';
import { useAuth } from './AuthContext';
import '../styles/loginPage.css';

function SignupPage() {
    const [userKey, setUserKey] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isGeneratingKey, setIsGeneratingKey] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleGenerateKey = async () => {
        setIsGeneratingKey(true);
        try {
            const result = await generateUserKey();
            setUserKey(result.user_key);
        } catch (err) {
            setError('Failed to generate user key');
        } finally {
            setIsGeneratingKey(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const result = await registerUser(userKey, password);
            login(result.access_token);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Create Account</h2>
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="userKey">User Key</label>
                        <div className="user-key-input">
                            <input
                                type="text"
                                id="userKey"
                                value={userKey}
                                onChange={(e) => setUserKey(e.target.value)}
                                placeholder="Generate or enter a key"
                                required
                                maxLength={12}
                                disabled={isGeneratingKey}
                            />
                            <button
                                type="button"
                                onClick={handleGenerateKey}
                                className="generate-key-button"
                                disabled={isGeneratingKey}
                            >
                                {isGeneratingKey ? 'Generating...' : 'Generate Key'}
                            </button>
                        </div>
                        <small>This will be your unique identifier. Save it carefully!</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a password"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="signup-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="login-link">
                    <p>Already have an account?</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="link-button"
                    >
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SignupPage;