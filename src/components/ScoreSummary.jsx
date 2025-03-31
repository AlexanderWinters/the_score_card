import React from 'react'

function ScoreSummary({ scores, handicap }) {
    const totalScore = scores.reduce((sum, score) => sum + score, 0)
    const adjustedScore = Math.max(0, totalScore - handicap)

    return (
        <div className="score-summary">
            <h2>Summary</h2>
            <div className="summary-row">
                <div>Gross Score:</div>
                <div>{totalScore}</div>
            </div>
            <div className="summary-row">
                <div>Handicap:</div>
                <div>{handicap}</div>
            </div>
            <div className="summary-row total">
                <div>Net Score:</div>
                <div>{adjustedScore}</div>
            </div>
        </div>
    )
}

export default ScoreSummary