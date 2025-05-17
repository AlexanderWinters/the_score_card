import React, {useState} from 'react'
import '../styles/scorecard.css';
import HoleInput from './HoleInput';

function ScoreCard({ scores, updateScore, courseData, handicap, playerName }) {
    // Calculate handicap strokes for a hole based on player's handicap and hole's index
    const [puttCounts, setPuttCounts] = useState(Array(18).fill(0));

    const calculateHcpStrokes = (hcpIndex, playerHandicap) => {
        // Distribute handicap strokes according to hole difficulty
        return hcpIndex <= playerHandicap ? 1 : 0;
    };

    const updatePuttCount = (index, value) => {
        const newPuttCounts = [...puttCounts];
        newPuttCounts[index] = value;
        setPuttCounts(newPuttCounts);
    };

    const totalPutts = puttCounts.reduce((sum, count) => sum + count, 0);

    // Function to determine the score type compared to par
    const getScoreType = (score, par) => {
        if (!score) return null; // No score entered
        if (score === par) return "par";
        if (score === par + 1) return "bogey";
        if (score > par + 1) return "double-bogey";
        if (score === par - 1) return "birdie";
        if (score < par - 1) return "eagle";
        return null;
    };

    return (
        <div className="scorecard-container">
            <div className="scorecard-player">
                <span className="player-label">Player:</span>
                <span className="player-name">{playerName}</span>
            </div>

            <div className="course-name-banner">
                {courseData.name}
            </div>

            <div className="scorecard-scroll">
                <div className="scorecard">
                    <div className="scorecard-table">

                        <div className="scorecard-row">
                            <div className="row-label">Hole</div>
                            {courseData.holes.map((hole) => (
                                <div key={hole.number} className="hole-column">
                                    <div className="hole-number">{hole.number}</div>
                                </div>
                            ))}
                            <div className="hole-column total-column">
                                <div className="hole-number">Total</div>
                            </div>
                        </div>

                        <div className="scorecard-row">
                            <div className="row-label">Meters</div>
                            {courseData.holes.map((hole, index) => (
                                <div key={index} className="hole-column">
                                    <div className="hole-distance">{hole.distance}</div>
                                </div>
                            ))}
                            <div className="hole-column total-column">
                                <div className="hole-distance">
                                    {courseData.holes.reduce((sum, hole) => sum + hole.distance, 0)}
                                </div>
                            </div>
                        </div>

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

                        <div className="scorecard-row">
                            <div className="row-label">HCP</div>
                            {courseData.holes.map((hole, index) => {
                                const hcpStrokes = calculateHcpStrokes(hole.hcpIndex, handicap);
                                const netPar = hole.par + hcpStrokes;
                                return (
                                    <div key={index} className="hole-column">
                                        <div className="hole-hcp">{netPar}</div>
                                    </div>
                                );
                            })}
                            <div className="hole-column total-column">
                                <div className="hole-hcp">
                                    {courseData.holes.reduce((sum, hole) => sum + hole.par, 0) +
                                        Math.min(handicap, 18)}
                                </div>
                            </div>
                        </div>

                        <div className="scorecard-row">
                            <div className="row-label">Score</div>
                            {courseData.holes.map((hole, index) => {
                                const scoreType = getScoreType(scores[index], hole.par);
                                return (
                                    <div key={index} className="hole-column">
                                        <div className="hole-score">
                                            <div className="score-container">
                                                {scoreType === "bogey" || scoreType === "double-bogey" ? (
                                                    <div className="score-square">
                                                        <input
                                                            type="number"
                                                            value={scores[index] === 0 ? '' : scores[index]}
                                                            onChange={(e) => updateScore(index, Number(e.target.value) || 0)}
                                                            min="1"
                                                            placeholder="-"
                                                            className={scoreType === "double-bogey" ? "over-par" : ""}
                                                        />
                                                    </div>
                                                ) : scoreType === "birdie" || scoreType === "eagle" ? (
                                                    <div className="score-circle">
                                                        <input
                                                            type="number"
                                                            value={scores[index] === 0 ? '' : scores[index]}
                                                            onChange={(e) => updateScore(index, Number(e.target.value) || 0)}
                                                            min="1"
                                                            placeholder="-"
                                                            className="under-par"
                                                        />
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        value={scores[index] === 0 ? '' : scores[index]}
                                                        onChange={(e) => updateScore(index, Number(e.target.value) || 0)}
                                                        min="1"
                                                        placeholder="-"
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

                        {/* Add the new putts row */}
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

                    </div>
                </div>
            </div>
        </div>
    )
}

export default ScoreCard