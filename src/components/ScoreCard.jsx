import React from 'react'

function ScoreCard({ scores, updateScore, courseData, handicap, playerName }) {
    // Calculate handicap strokes for a hole based on player's handicap and hole's index
    const calculateHcpStrokes = (hcpIndex, playerHandicap) => {
        // Distribute handicap strokes according to hole difficulty
        return hcpIndex <= playerHandicap ? 1 : 0;
    };

    return (
        <div className="scorecard">
            <div className="scorecard-player">
                <span className="player-label">Player:</span>
                <span className="player-name">{playerName}</span>
            </div>

            <div className="course-name-banner">
                {courseData.name}
            </div>

            <div className="scorecard-header">
                <div className="hole-number">Hole</div>
                <div className="hole-distance">Yards</div>
                <div className="hole-par">Par</div>
                <div className="hole-hcp">HCP</div>
                <div className="hole-score">Score</div>
            </div>

            <div className="scorecard-body">
                {courseData.holes.map((hole, index) => {
                    const hcpStrokes = calculateHcpStrokes(hole.hcpIndex, handicap);
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
                                    value={scores[index] === 0 ? '' : scores[index]}
                                    onChange={(e) => updateScore(index, Number(e.target.value) || 0)}
                                    min="1"
                                    placeholder="-"
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="scorecard-footer">
                <div className="hole-number">Total</div>
                <div className="hole-distance">
                    {courseData.holes.reduce((sum, hole) => sum + hole.distance, 0)}
                </div>
                <div className="hole-par">
                    {courseData.holes.reduce((sum, hole) => sum + hole.par, 0)}
                </div>
                <div className="hole-hcp">
                    {courseData.holes.reduce((sum, hole) => sum + hole.par, 0) +
                        Math.min(handicap, 18)}
                </div>
                <div className="hole-score">
                    {scores.reduce((sum, score) => sum + score, 0) || '-'}
                </div>
            </div>
        </div>
    )
}

export default ScoreCard