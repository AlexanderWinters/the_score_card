import React from 'react'

function ScoreCard({ scores, updateScore, courseData, handicap, playerName }) {
    // Calculate handicap strokes for a hole based on player's handicap and hole's index
    const calculateHcpStrokes = (hcpIndex, playerHandicap) => {
        // Distribute handicap strokes according to hole difficulty
        return hcpIndex <= playerHandicap ? 1 : 0;
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
                            <div className="row-label">Yards</div>
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
                            {courseData.holes.map((hole, index) => (
                                <div key={index} className="hole-column">
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
                            ))}
                            <div className="hole-column total-column">
                                <div className="hole-score">
                                    {scores.reduce((sum, score) => sum + score, 0) || '-'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ScoreCard