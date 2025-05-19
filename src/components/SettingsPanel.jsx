// src/components/SettingsPanel.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HandicapInput from './HandicapInput';
import '../styles/settings.css';
import { FaCog } from 'react-icons/fa';

function SettingsPanel({
                           isLoggedIn,
                           logout,
                           resetSession,
                           handicap,
                           setHandicap,
                           handleSaveRound,
                           isSaving
                       }) {
    const [isOpen, setIsOpen] = useState(false);

    const togglePanel = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="settings-container">
            <button
                className="settings-button"
                onClick={togglePanel}
                aria-expanded={isOpen}
                aria-label="Settings menu"
            >
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>⚙</span>



            </button>

            <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
                <div className="settings-header">
                    <h3>Settings</h3>
                    <button className="close-button" onClick={togglePanel}>×</button>
                </div>

                <div className="settings-content">
                    <div className="settings-section">
                        <h4>Player Settings</h4>
                        <div className="setting-item">
                            <HandicapInput handicap={handicap} setHandicap={setHandicap} />
                        </div>
                    </div>

                    <div className="settings-section">
                        <h4>Round Management</h4>
                        <div className="setting-item button-group">
                            <button
                                className="settings-action-button new-round"
                                onClick={() => {
                                    resetSession();
                                    togglePanel();
                                }}
                            >
                                New Round
                            </button>

                            {isLoggedIn && (
                                <button
                                    className="settings-action-button save-round"
                                    onClick={() => {
                                        handleSaveRound();
                                        togglePanel();
                                    }}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save Round'}
                                </button>
                            )}
                        </div>
                    </div>

                    {isLoggedIn && (
                        <div className="settings-section">
                            <h4>Account</h4>
                            <div className="setting-item button-group">
                                <Link to="/rounds" className="settings-action-button my-rounds" onClick={togglePanel}>
                                    My Rounds
                                </Link>
                                <button className="settings-action-button logout" onClick={() => {
                                    logout();
                                    togglePanel();
                                }}>
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="settings-section">
                        <h4>Administration</h4>
                        <div className="setting-item">
                            <Link to="/admin" className="settings-action-button admin" onClick={togglePanel}>
                                Admin Panel
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SettingsPanel;