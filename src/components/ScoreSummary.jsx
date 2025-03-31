import React from 'react'

function ScoreSummary({ scores, handicap, courseName, courseData }) {
    const totalScore = scores.reduce((sum, score) => sum + score, 0)
    const totalPar = courseData.holes.reduce((sum, hole) => sum + hole.par, 0)
    const adjustedScore = Math.max(0, totalScore - handicap)
    const parComparison = totalScore - totalPar

    return (
        <div className="score-summary">
            <h2>Summary - {courseName}</h2>
            <div className="summary-row">
                <div>Course Par:</div>
                <div>{totalPar}</div>
            </div>
            <div className="summary-row">
                <div>Gross Score:</div>
                <div>{totalScore}</div>
            </div>
            <div className="summary-row">
                <div>vs. Par:</div>
                <div className={parComparison > 0 ? 'over-par' : parComparison < 0 ? 'under-par' : ''}>
                    {parComparison > 0 ? `+${parComparison}` : parComparison}
                </div>
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