import React from 'react';

function CourseInfo({
                        availableCourses,
                        selectedCourseId,
                        setSelectedCourseId,
                        selectedTeeBoxId,
                        setSelectedTeeBoxId,
                        playerName,
                        setPlayerName,
                        selectedCourse
                    }) {
    const handleCourseChange = (e) => {
        const courseId = Number(e.target.value);
        console.log('Selected course ID:', courseId);
        setSelectedCourseId(courseId);
    };

    const handleTeeChange = (e) => {
        setSelectedTeeBoxId(Number(e.target.value));
    };

    return (
        <div className="course-info">
            <h2>Course Information</h2>

            <div className="info-row">
                <label htmlFor="playerName">Player:</label>
                <input
                    id="playerName"
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                />
            </div>

            <div className="info-row">
                <label htmlFor="courseSelect">Course:</label>
                <select
                    id="courseSelect"
                    value={selectedCourseId}
                    onChange={handleCourseChange}
                    className="course-select"
                >
                    {availableCourses.map(course => (
                        <option key={course.id} value={course.id}>
                            {course.name}
                        </option>
                    ))}
                </select>
            </div>

            {selectedCourse && selectedCourse.teeBoxes && (
                <div className="info-row">
                    <label htmlFor="teeSelect">Tee:</label>
                    <select
                        id="teeSelect"
                        value={selectedTeeBoxId}
                        onChange={handleTeeChange}
                        className="tee-select"
                    >
                        {selectedCourse.teeBoxes.map(tee => (
                            <option key={tee.id} value={tee.id}>
                                {tee.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}

export default CourseInfo;