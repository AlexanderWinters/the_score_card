import React, {useState} from 'react'
import '../styles/scorecard.css';

function ScoreCard({ scores, updateScore, courseData, handicap, playerName }) {
    // Calculate handicap strokes for a hole based on player's handicap and hole's index
    const [puttCounts, setPuttCounts] = useState(Array(18).fill(0));
    const [girCounts, setGirCounts] = useState(Array(18).fill(false));

    const calculateHcpStrokes = (hcpIndex, playerHandicap) => {
        // Distribute handicap strokes according to hole difficulty
        return hcpIndex <= playerHandicap ? 1 : 0;
    };

    const updatePuttCount = (index, value) => {
        const newPuttCounts = [...puttCounts];
        newPuttCounts[index] = value;
        setPuttCounts(newPuttCounts);
    };

    const updateGirCount = (index, value) => {
        const newGirCounts = [...girCounts];
        newGirCounts[index] = value;
        setGirCounts(newGirCounts);
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
                        {/* Hole row */}
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

                        {/* Meters row */}
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

                        {/* HCP row */}
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
                                                            onChange={(e) => updateScore(index, Number(e.target.value) || 0)}
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
                                                        onChange={(e) => updateScore(index, Number(e.target.value) || 0)}
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