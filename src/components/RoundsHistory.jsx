import { useState, useEffect } from 'react';
import { getUserRounds } from '../api/authApi';
import { useNavigate } from 'react-router-dom';
import { FaGolfBall, FaFlagCheckered, FaChartLine, FaHome, FaUmbrellaBeach } from 'react-icons/fa';
import '../styles/roundsHistory.css';

function RoundsHistory() {
    const [rounds, setRounds] = useState([]);
    const [selectedRound, setSelectedRound] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState('summary'); // 'summary', 'details', 'stats'
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

    const calculateStats = () => {
        if (rounds.length === 0) return null;

        let totalScore = 0;
        let totalPutts = 0;
        let totalGIR = 0;
        let totalFairways = 0;
        let totalBunkers = 0;
        let bestRound = { score: Infinity, date: '', course: '' };
        let roundsPlayed = rounds.length;

        let holesPlayed = 0;
        let parThreeCount = 0;
        let parFourCount = 0;
        let parFiveCount = 0;

        rounds.forEach(round => {
            const score = round.total_score;
            totalScore += score;

            if (score < bestRound.score) {
                bestRound = {
                    score: score,
                    date: round.date,
                    course: round.course_name
                };
            }

            if (round.putts) {
                const roundPutts = round.putts.filter(putts => putts > 0).reduce((sum, putts) => sum + putts, 0);
                totalPutts += roundPutts;
            }

            if (round.gir) {
                totalGIR += round.gir.filter(gir => gir).length;
            }

            if (round.fairways) {
                totalFairways += round.fairways.filter(fairway => fairway).length;
            }

            if (round.bunkers) {
                totalBunkers += round.bunkers.reduce((sum, bunker) => sum + bunker, 0);
            }

            const completedHoles = round.scores.filter(s => s > 0).length;
            holesPlayed += completedHoles;
        });

        return {
            roundsPlayed,
            holesPlayed,
            averageScore: Math.round(totalScore / roundsPlayed),
            bestRound,
            puttStats: {
                total: totalPutts,
                average: totalPutts > 0 ? (totalPutts / holesPlayed).toFixed(1) : '0.0'
            },
            girStats: {
                total: totalGIR,
                percentage: holesPlayed > 0 ? Math.round((totalGIR / holesPlayed) * 100) : 0
            },
            fairwayStats: {
                total: totalFairways,
                percentage: holesPlayed > 0 ? Math.round((totalFairways / holesPlayed) * 100) : 0
            },
            bunkerStats: {
                total: totalBunkers,
                average: holesPlayed > 0 ? (totalBunkers / roundsPlayed).toFixed(1) : '0.0'
            }
        };
    };

    const handleViewRoundDetails = (round) => {
        setSelectedRound(round);
        setView('details');
    };

    const getRoundStats = (round) => {
        if (!round) return null;

        const completedHoles = round.scores.filter(score => score > 0).length;
        const totalPutts = round.putts ? round.putts.reduce((sum, putts) => sum + putts, 0) : 0;
        const girCount = round.gir ? round.gir.filter(gir => gir).length : 0;
        const fairwaysCount = round.fairways ? round.fairways.filter(fairway => fairway).length : 0;
        const bunkersCount = round.bunkers ? round.bunkers.reduce((sum, bunkers) => sum + bunkers, 0) : 0;

        return {
            completedHoles,
            totalPutts,
            puttAverage: totalPutts > 0 ? (totalPutts / completedHoles).toFixed(1) : '0.0',
            girCount,
            girPercentage: completedHoles > 0 ? Math.round((girCount / completedHoles) * 100) : 0,
            fairwaysCount,
            fairwaysPercentage: completedHoles > 0 ? Math.round((fairwaysCount / completedHoles) * 100) : 0,
            bunkersCount
        };
    };

    const stats = calculateStats();

    // Function to render the progress bar
    const renderProgressBar = (percentage, color) => (
        <div className="progress-bar-container">
            <div
                className="progress-bar"
                style={{
                    width: `${percentage}%`,
                    backgroundColor: color
                }}
            />
            <span className="progress-percentage">{percentage}%</span>
        </div>
    );

    const SummaryView = () => (
        <>
            {stats && (
                <div className="stats-dashboard">
                    <div className="stats-section">
                        <h3>Overall Performance</h3>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon"><FaGolfBall /></div>
                                <div className="stat-content">
                                    <span className="stat-value">{stats.roundsPlayed}</span>
                                    <span className="stat-label">Rounds Played</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon"><FaChartLine /></div>
                                <div className="stat-content">
                                    <span className="stat-value">{stats.averageScore}</span>
                                    <span className="stat-label">Avg. Score</span>
                                </div>
                            </div>
                            <div className="stat-card highlight-card">
                                <div className="stat-content">
                                    <span className="stat-value">{stats.bestRound.score}</span>
                                    <span className="stat-label">Best Round</span>
                                    <span className="stat-detail">{formatDate(stats.bestRound.date)} at {stats.bestRound.course}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="stats-section">
                        <h3>Game Statistics</h3>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon"><FaFlagCheckered /></div>
                                <div className="stat-content">
                                    <span className="stat-value">{stats.puttStats.average}</span>
                                    <span className="stat-label">Putts per Hole</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-content">
                                    <span className="stat-value">{stats.girStats.percentage}%</span>
                                    <span className="stat-label">Greens in Regulation</span>
                                    {renderProgressBar(stats.girStats.percentage, '#4CAF50')}
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-content">
                                    <span className="stat-value">{stats.fairwayStats.percentage}%</span>
                                    <span className="stat-label">Fairways Hit</span>
                                    {renderProgressBar(stats.fairwayStats.percentage, '#2196F3')}
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon"><FaUmbrellaBeach /></div>
                                <div className="stat-content">
                                    <span className="stat-value">{stats.bunkerStats.average}</span>
                                    <span className="stat-label">Bunkers per Round</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <h3 className="recent-rounds-title">Recent Rounds</h3>
            <div className="rounds-list">
                {rounds.map((round) => (
                    <div key={round.id} className="round-card" onClick={() => handleViewRoundDetails(round)}>
                        <div className="round-header">
                            <div className="round-date">{formatDate(round.date)}</div>
                            <div className="round-course">{round.course_name}</div>
                        </div>
                        <div className="round-details">
                            <div className="tee-info">
                                <span
                                    className="tee-color"
                                    style={{backgroundColor: round.tee_color.toLowerCase()}}
                                >
                                    {round.tee_name}
                                </span>
                            </div>
                            <div className="score-info">
                                <span className="total-score">{round.total_score}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );

    const RoundDetailsView = () => {
        if (!selectedRound) return null;

        const roundStats = getRoundStats(selectedRound);

        return (
            <div className="round-details-view">
                <div className="history-details-header">
                    <button className="back-button" onClick={() => setView('summary')}>
                        &larr; Back to Rounds
                    </button>
                    <h3>{formatDate(selectedRound.date)} at {selectedRound.course_name}</h3>
                </div>

                <div className="round-summary-card">
                    <div className="round-info-row">
                        <div className="info-item">
                            <span className="info-label">Tee:</span>
                            <span
                                className="tee-badge"
                                style={{backgroundColor: selectedRound.tee_color.toLowerCase()}}
                            >
                                {selectedRound.tee_name}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Score:</span>
                            <span className="info-value">{selectedRound.total_score}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Holes:</span>
                            <span className="info-value">{roundStats.completedHoles}</span>
                        </div>
                    </div>
                </div>

                <div className="round-stats-grid">
                    <div className="stat-box">
                        <div className="stat-icon"><FaFlagCheckered /></div>
                        <span className="stat-value">{roundStats.totalPutts}</span>
                        <span className="stat-label">Total Putts</span>
                        <span className="stat-detail">{roundStats.puttAverage} per hole</span>
                    </div>

                    <div className="stat-box">
                        <span className="stat-value">{roundStats.girPercentage}%</span>
                        <span className="stat-label">GIR</span>
                        <span className="stat-detail">{roundStats.girCount} greens hit</span>
                        {renderProgressBar(roundStats.girPercentage, '#4CAF50')}
                    </div>

                    <div className="stat-box">
                        <span className="stat-value">{roundStats.fairwaysPercentage}%</span>
                        <span className="stat-label">Fairways</span>
                        <span className="stat-detail">{roundStats.fairwaysCount} fairways hit</span>
                        {renderProgressBar(roundStats.fairwaysPercentage, '#2196F3')}
                    </div>

                    <div className="stat-box">
                        <div className="stat-icon"><FaUmbrellaBeach /></div>
                        <span className="stat-value">{roundStats.bunkersCount}</span>
                        <span className="stat-label">Bunkers</span>
                    </div>
                </div>

                <h4 className="history-scorecard-title">Scorecard</h4>
                <div className="history-scorecard">
                    <div className="history-scorecard-row history-header-row">
                        <div className="hole-cell">Hole</div>
                        <div className="score-cell">Score</div>
                        <div className="putts-cell">Putts</div>
                        <div className="gir-cell">GIR</div>
                        <div className="fairway-cell">FW</div>
                        <div className="bunker-cell">Bunker</div>
                    </div>

                    {selectedRound.scores.map((score, idx) => (
                        score > 0 && (
                            <div key={idx} className="history-scorecard-row">
                                <div className="hole-cell">{idx + 1}</div>
                                <div className="score-cell">{score}</div>
                                <div className="putts-cell">{selectedRound.putts ? selectedRound.putts[idx] : '-'}</div>
                                <div className="gir-cell">{selectedRound.gir && selectedRound.gir[idx] ? '✓' : '-'}</div>
                                <div className="fairway-cell">{selectedRound.fairways && selectedRound.fairways[idx] ? '✓' : '-'}</div>
                                <div className="bunker-cell">{selectedRound.bunkers ? selectedRound.bunkers[idx] : '0'}</div>
                            </div>
                        )
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="rounds-history-container">
            <div className="history-header-bar">
                <h2>Round History</h2>
                <div className="history-action-buttons">
                    <button
                        className="home-button"
                        onClick={() => navigate('/')}
                        aria-label="Go to home page"
                    >
                        <FaHome /> New Round
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading your rounds...</p>
                </div>
            ) : error ? (
                <div className="error-container">
                    <p>{error}</p>
                    <button onClick={() => navigate('/')}>Return Home</button>
                </div>
            ) : rounds.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon"><FaGolfBall /></div>
                    <h3>No rounds recorded yet</h3>
                    <p>Complete and save a round to see your statistics here.</p>
                    <button onClick={() => navigate('/')}>Start a New Round</button>
                </div>
            ) : (
                <div className="content-container">
                    {view === 'summary' ? <SummaryView /> : <RoundDetailsView />}
                </div>
            )}
        </div>
    );
}

export default RoundsHistory;