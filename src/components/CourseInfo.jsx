import React from 'react'

function CourseInfo({
                        availableCourses,
                        selectedCourseId,
                        setSelectedCourseId,
                        playerName,
                        setPlayerName
                    }) {
    return (
        <div className="course-info">
            <div className="info-row">
                <label htmlFor="courseName">Course:</label>
                <select
                    id="courseName"
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                    className="course-select"
                >
                    {availableCourses.map(course => (
                        <option key={course.id} value={course.id}>
                            {course.name}
                        </option>
                    ))}
                </select>
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