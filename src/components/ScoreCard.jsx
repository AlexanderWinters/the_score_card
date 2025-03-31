import React from 'react'
import HoleInput from './HoleInput'

function ScoreCard({ scores, updateScore, courseData, handicap, playerName }) {
    // Calculate handicap distribution across holes (starting from hardest holes)
    const calculateHcpStrokes = (holeIndex, playerHandicap) => {
        // In a real app, we would use the hole's handicap index
        // For simplicity, we'll just distribute handicap across holes sequentially
        const hardnessRank = (holeIndex % 18) + 1;
        return hardnessRank <= playerHandicap ? 1 : 0;
    };

    return (
        <div className="scorecard">
            <div className="scorecard-player">
                <span className="player-label">Player:</span>
                <span className="player-name">{playerName}</span>
            </div>

            <div className="scorecard-header">
                <div className="hole-number">Hole</div>
                <div className="hole-distance">Yards</div>
                <div className="hole-par">Par</div>
                <div className="hole-hcp">HCP</div>
                <div className="hole-score">Score</div>
            </div>

            <div className="scorecard-body">
                {scores.map((score, index) => {
                    const hole = courseData.holes[index];
                    const hcpStrokes = calculateHcpStrokes(index, handicap);
                    const netPar = hole.par + hcpStrokes;

                    return (
                        <div className="hole-row" key={index}>
                            <div className="hole-number">{hole.number}</div>
                            <div className="hole-distance">{hole.distance}</div>
                            <div className="hole-par">{hole.par}</div>
                            <div className="hole-hcp">{netPar}</div>
                            <div className="hole-score">
                                <input
                                    type="number"
                                    value={score === 0 ? '' : score}
                                    onChange={(e) => updateScore(index, Number(e.target.value))}
                                    min="1"
                                    placeholder="-"
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default ScoreCard