// CourseInfo.jsx
import React from 'react';

function CourseInfo({
                        availableCourses,
                        selectedCourseId,
                        setSelectedCourseId,
                        selectedTeeBoxId,
                        setSelectedTeeBoxId,
                        playerName,
                        setPlayerName
                    }) {
    const selectedCourse = availableCourses.find(course => course.id === selectedCourseId);

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
                <label htmlFor="teeBox">Tee:</label>
                <select
                    id="teeBox"
                    value={selectedTeeBoxId}
                    onChange={(e) => setSelectedTeeBoxId(Number(e.target.value))}
                    className="tee-select"
                >
                    {selectedCourse.teeBoxes.map(tee => (
                        <option key={tee.id} value={tee.id}>
                            {tee.name} ({tee.color})
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
    );
}

export default CourseInfo;