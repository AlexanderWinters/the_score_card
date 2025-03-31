import React from 'react'

function HandicapInput({ handicap, setHandicap }) {
    return (
        <div className="handicap-input">
            <label htmlFor="handicap">Handicap: </label>
            <input
                id="handicap"
                type="number"
                value={handicap}
                onChange={(e) => setHandicap(Number(e.target.value))}
                min="0"
                max="54"
            />
        </div>
    )
}

export default HandicapInput