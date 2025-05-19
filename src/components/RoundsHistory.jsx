// src/components/RoundsHistory.jsx
import { useState, useEffect } from 'react';
import { getUserRounds } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import '../styles/RoundsHistory.css';

function RoundsHistory() {
    const [rounds, setRounds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRounds = async () => {
            try {
                const roundsData = await getUserRounds();
                setRounds(roundsData);
                setError('');
            } catch (err) {
                setError('Failed to load your rounds. Please try again later.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRounds();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Calculate statistics
    const calculateStats = () => {
        if (rounds.length === 0) return null;

        let totalScore = 0;
        let bestRound = Infinity;
        let roundsPlayed = rounds.length;

        rounds.forEach(round => {
            const score = round.total_score;
            totalScore += score;
            if (score < bestRound) bestRound = score;
        });

        return {
            roundsPlayed,
            averageScore: Math.round(totalScore / roundsPlayed),
            bestRound
        };
    };

    const stats = calculateStats();

    return (
        <div className="rounds-history-container">
            <div className="rounds-header">
                <h2>Your Round History</h2>
                <button
                    className="new-round-button"
                    onClick={() => navigate('/')}
                >
                    New Round
                </button>
            </div>

            {stats && (
                <div className="rounds-statistics">
                    <div className="stat-box">
                        <span className="stat-value">{stats.roundsPlayed}</span>
                        <span className="stat-label">Rounds Played</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-value">{stats.averageScore}</span>
                        <span className="stat-label">Average Score</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-value">{stats.bestRound}</span>
                        <span className="stat-label">Best Round</span>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="rounds-loading">Loading your rounds...</div>
            ) : error ? (
                <div className="rounds-error">{error}</div>
            ) : rounds.length === 0 ? (
                <div className="no-rounds">
                    <p>You haven't played any rounds yet.</p>
                </div>
            ) : (
                <div className="rounds-list">
                    {rounds.map((round) => (
                        <div key={round.id} className="round-card">
                            <div className="round-header">
                                <div className="round-date">{formatDate(round.date)}</div>
                                <div className="round-course">{round.course_name}</div>
                            </div>

                            <div className="round-details">
                                <div className="tee-info">
                                    <span className="tee-label">Tee:</span>
                                    <span
                                        className="tee-color"
                                        style={{backgroundColor: round.tee_color.toLowerCase()}}
                                    >
                                        {round.tee_name}
                                    </span>
                                </div>

                                <div className="score-info">
                                    <span className="score-label">Score:</span>
                                    <span className="total-score">{round.total_score}</span>
                                </div>
                            </div>

                            <div className="score-breakdown">
                                {round.scores.map((score, idx) => (
                                    score > 0 && (
                                        <div key={idx} className="hole-score">
                                            <span className="hole-number">#{idx + 1}</span>
                                            <span className="hole-result">{score}</span>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default RoundsHistory;