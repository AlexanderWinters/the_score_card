import React from 'react'
import HoleInput from './HoleInput'

function ScoreCard({ scores, updateScore }) {
    return (
        <div className="scorecard">
            <div className="scorecard-header">
                <div>Hole</div>
                <div>Score</div>
            </div>
            <div className="scorecard-body">
                {scores.map((score, index) => (
                    <HoleInput
                        key={index}
                        holeNumber={index + 1}
                        score={score}
                        onChange={(value) => updateScore(index, value)}
                    />
                ))}
            </div>
        </div>
    )
}

export default ScoreCard