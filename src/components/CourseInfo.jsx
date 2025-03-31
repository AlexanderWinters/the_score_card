import React from 'react'

function CourseInfo({ courseName, setCourseName, playerName, setPlayerName }) {
    return (
        <div className="course-info">
            <div className="info-row">
                <label htmlFor="courseName">Course:</label>
                <input
                    id="courseName"
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="Enter course name"
                />
            </div>
            <div className="info-row">
                <label htmlFor="playerName">Player:</label>
                <input
                    id="playerName"
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter player name"
                />
            </div>
        </div>
    )
}

export default CourseInfo