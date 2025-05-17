import React from 'react';
import '../styles/theme-toggle.css';

function ThemeToggle({ darkMode, setDarkMode }) {
    return (
        <div className="theme-toggle">
            <label className="switch">
                <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={() => setDarkMode(!darkMode)}
                />
                <span className="slider round"></span>
            </label>
            <span className="toggle-label">{darkMode ? 'Dark' : 'Light'} Mode</span>
        </div>
    );
}

export default ThemeToggle;