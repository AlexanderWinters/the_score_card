import React from 'react'

function HoleInput({ holeNumber, score, onChange }) {
    return (
        <div className="hole-input">
            <div className="hole-number">Hole {holeNumber}</div>
            <input
                type="number"
                value={score === 0 ? '' : score}
                onChange={(e) => onChange(Number(e.target.value))}
                min="1"
                placeholder="-"
            />
        </div>
    )
}

export default HoleInput