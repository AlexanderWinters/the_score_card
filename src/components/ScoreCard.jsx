import React, {useState, useEffect} from 'react'
import '../styles/scorecard.css';

function ScoreCard({ scores, updateScore, courseData, /*handicap*/ playerName, resetPuttsAndGIR
                   }) {
    // Initialize from localStorage or use defaults
    const [puttCounts, setPuttCounts] = useState(() => {
        const savedPutts = localStorage.getItem('puttCounts');
        return savedPutts ? JSON.parse(savedPutts) : Array(18).fill(0);
    });

    const [girCounts, setGirCounts] = useState(() => {
        const savedGirs = localStorage.getItem('girCounts');
        return savedGirs ? JSON.parse(savedGirs) : Array(18).fill(false);
    });

    // State to track the current active hole
    const [currentHole, setCurrentHole] = useState(null);

    // Find the first unregistered hole whenever scores change
    useEffect(() => {
        const firstUnregisteredIndex = scores.findIndex(score => score === 0);
        const nextHole = firstUnregisteredIndex !== -1
            ? courseData.holes[firstUnregisteredIndex]
            : null;
        setCurrentHole(nextHole);
    }, [scores, courseData.holes]);

    useEffect(() => {
        if (resetPuttsAndGIR) {
            setPuttCounts(Array(18).fill(0));
            setGirCounts(Array(18).fill(false));
        }
    }, [resetPuttsAndGIR]);


    // Save putts and GIRs to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('puttCounts', JSON.stringify(puttCounts));
    }, [puttCounts]);

    useEffect(() => {
        localStorage.setItem('girCounts', JSON.stringify(girCounts));
    }, [girCounts]);

    // const calculateHcpStrokes = (hcpIndex, playerHandicap) => {
    //     // Distribute handicap strokes according to hole difficulty
    //     return hcpIndex <= playerHandicap ? 1 : 0;
    // };

    const updatePuttCount = (index, value) => {
        const newPuttCounts = [...puttCounts];
        newPuttCounts[index] = value;
        setPuttCounts(newPuttCounts);

        // Auto-select GIR when par is achieved with 2 putts
        const par = courseData.holes[index].par;
        if (scores[index] === par && value === 2) {
            updateGirCount(index, true);
        }
    };

    const updateGirCount = (index, value) => {
        const newGirCounts = [...girCounts];
        newGirCounts[index] = value;
        setGirCounts(newGirCounts);
    };

    // Modified to check for par + 2 putts when score is updated
    const handleScoreUpdate = (index, value) => {
        updateScore(index, value);

        // Check if this is par with 2 putts
        const par = courseData.holes[index].par;
        if (value === par && puttCounts[index] === 2) {
            updateGirCount(index, true);
        }
    };

    const totalPutts = puttCounts.reduce((sum, count) => sum + count, 0);
    const totalGirs = girCounts.filter(gir => gir).length;

    // Enhanced function to determine the score type compared to par
    const getScoreType = (score, par) => {
        if (!score) return null; // No score entered

        const scoreDiff = score - par;

        if (scoreDiff === 0) return "par";
        if (scoreDiff === 1) return "bogey";
        if (scoreDiff >= 2) return "double-bogey";
        if (scoreDiff === -1) return "birdie";
        if (scoreDiff <= -2) return "eagle";

        return null;
    };

    // Get the appropriate CSS class based on score type
    const getScoreClass = (scoreType) => {
        switch (scoreType) {
            case "bogey":
                return "score-square";
            case "double-bogey":
                return "score-double-square";
            case "birdie":
                return "score-circle";
            case "eagle":
                return "score-double-circle";
            default:
                return "";
        }
    };

    // Get the text color class based on score type
    const getTextColorClass = (scoreType) => {
        if (scoreType === "bogey" || scoreType === "double-bogey") {
            return "over-par";
        } else if (scoreType === "birdie" || scoreType === "eagle") {
            return "under-par";
        }
        return "";
    };

    return (
        <div className="scorecard-container">
            {/* FIRST TABLE: Main Scorecard */}
            <div className="scorecard-header-banner">
                <div className="player-info">
                    {playerName} • {courseData.name}
                    <strong>{currentHole && ` • Hole ${currentHole.number} (${currentHole.distance}m)`}</strong>
                </div>
            </div>

            <div className="scorecard-scroll">
                <div className="scorecard">
                    <div className="scorecard-table main-scorecard">
                        {/* Minimal Hole row */}
                        <div className="scorecard-row hole-number-row">
                            <div className="row-label hole-label">Hole</div>
                            {courseData.holes.map((hole) => (
                                <div key={hole.number} className="hole-column">
                                    <div className="hole-number">{hole.number}</div>
                                </div>
                            ))}
                            <div className="hole-column total-column">
                                <div className="hole-number">Total</div>
                            </div>
                        </div>

                        {/* Par row */}
                        <div className="scorecard-row">
                            <div className="row-label">Par</div>
                            {courseData.holes.map((hole, index) => (
                                <div key={index} className="hole-column">
                                    <div className="hole-par">{hole.par}</div>
                                </div>
                            ))}
                            <div className="hole-column total-column">
                                <div className="hole-par">
                                    {courseData.holes.reduce((sum, hole) => sum + hole.par, 0)}
                                </div>
                            </div>
                        </div>

                        {/* Score row */}
                        <div className="scorecard-row">
                            <div className="row-label">Score</div>
                            {courseData.holes.map((hole, index) => {
                                const scoreType = getScoreType(scores[index], hole.par);
                                const scoreClass = getScoreClass(scoreType);
                                const textColorClass = getTextColorClass(scoreType);

                                return (
                                    <div key={index} className="hole-column">
                                        <div className="hole-score">
                                            <div className="score-container">
                                                {scoreClass ? (
                                                    <div className={scoreClass}>
                                                        <input
                                                            type="number"
                                                            value={scores[index] === 0 ? '' : scores[index]}
                                                            onChange={(e) => handleScoreUpdate(index, Number(e.target.value) || 0)}
                                                            min="1"
                                                            max="20"
                                                            placeholder="-"
                                                            className={`score-input ${textColorClass}`}
                                                            aria-label={`Score for hole ${index + 1}`}
                                                        />
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        value={scores[index] === 0 ? '' : scores[index]}
                                                        onChange={(e) => handleScoreUpdate(index, Number(e.target.value) || 0)}
                                                        min="1"
                                                        max="20"
                                                        placeholder="-"
                                                        className="score-input"
                                                        aria-label={`Score for hole ${index + 1}`}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="hole-column total-column">
                                <div className="hole-score">
                                    {scores.reduce((sum, score) => sum + score, 0) || '-'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECOND TABLE: Details Scorecard */}
            <div className="scorecard-header-banner details-header">
                <div className="player-info">
                    <strong>{currentHole && `Hole ${currentHole.number} Details`}</strong>
                </div>
            </div>

            <div className="scorecard-scroll">
                <div className="scorecard">
                    <div className="scorecard-table details-scorecard">
                        {/* Hole row for details table */}
                        <div className="scorecard-row hole-number-row">
                            <div className="row-label hole-label">Hole</div>
                            {courseData.holes.map((hole) => (
                                <div key={hole.number} className="hole-column">
                                    <div className="hole-number">{hole.number}</div>
                                </div>
                            ))}
                            <div className="hole-column total-column">
                                <div className="hole-number">Total</div>
                            </div>
                        </div>

                        {/* Putts row */}
                        <div className="scorecard-row putt-row">
                            <div className="row-label putt-label">Putts</div>
                            {puttCounts.map((putts, index) => (
                                <div key={index} className="hole-column putt-column">
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={putts || ''}
                                        onChange={(e) => updatePuttCount(index, parseInt(e.target.value) || 0)}
                                        className="putt-input"
                                        aria-label={`Putts for hole ${index + 1}`}
                                    />
                                </div>
                            ))}
                            <div className="hole-column total-column">
                                {totalPutts}
                            </div>
                        </div>

                        {/* GIR row */}
                        <div className="scorecard-row gir-row">
                            <div className="row-label gir-label">GIR</div>
                            {girCounts.map((gir, index) => (
                                <div key={index} className="hole-column gir-column">
                                    <div
                                        className={`gir-toggle ${gir ? 'gir-hit' : 'gir-miss'}`}
                                        onClick={() => updateGirCount(index, !gir)}
                                        aria-label={`Green in Regulation for hole ${index + 1}`}
                                        role="checkbox"
                                        aria-checked={gir}
                                        tabIndex="0"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                updateGirCount(index, !gir);
                                            }
                                        }}
                                    >
                                        {gir ? '✓' : ''}
                                    </div>
                                </div>
                            ))}
                            <div className="hole-column total-column">
                                {totalGirs}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ScoreCard