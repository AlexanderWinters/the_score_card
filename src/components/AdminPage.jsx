// src/components/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { fetchAllCourses, addCourse, uploadJsonCourses, uploadCsvCourses } from '../api/courseApi';
import '../styles/adminPage.css';

function AdminPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [courseName, setCourseName] = useState('');
    const [courseLocation, setCourseLocation] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [teeBoxes, setTeeBoxes] = useState([{ name: '', color: '', holes: [] }]);

    // File upload state
    const [jsonFile, setJsonFile] = useState(null);
    const [csvFile, setCsvFile] = useState(null);

    // Load courses on component mount
    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        setLoading(true);
        try {
            const data = await fetchAllCourses();
            setCourses(data);
        } catch (err) {
            setError('Failed to load courses');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Handle tee box changes
    const handleTeeBoxChange = (index, field, value) => {
        const updatedTeeBoxes = [...teeBoxes];
        updatedTeeBoxes[index][field] = value;
        setTeeBoxes(updatedTeeBoxes);
    };

    // Add a new tee box
    const addTeeBox = () => {
        setTeeBoxes([...teeBoxes, { name: '', color: '', holes: [] }]);
    };

    // Remove a tee box
    const removeTeeBox = (index) => {
        const updatedTeeBoxes = [...teeBoxes];
        updatedTeeBoxes.splice(index, 1);
        setTeeBoxes(updatedTeeBoxes);
    };

    // Generate holes for a tee box
    const generateHoles = (teeBoxIndex) => {
        // Generate 18 holes with default values
        const updatedTeeBoxes = [...teeBoxes];
        const holes = [];

        // Base values for hole generation
        const baseDistance = 150 + (Math.random() * 50);
        const distanceStep = 10 + (Math.random() * 10);

        for (let i = 1; i <= 18; i++) {
            holes.push({
                number: i,
                distance: Math.round(baseDistance + (i * distanceStep) + (Math.random() * 30 - 15)),
                par: i % 4 === 0 ? 5 : (i % 4 === 2 ? 3 : 4),
                hcp_index: ((i * 7) % 18) + 1
            });
        }

        updatedTeeBoxes[teeBoxIndex].holes = holes;
        setTeeBoxes(updatedTeeBoxes);
    };

    // Submit the form
    const handleSubmitForm = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            // Validate form
            if (!courseName.trim()) {
                throw new Error('Course name is required');
            }

            if (teeBoxes.length === 0) {
                throw new Error('At least one tee box is required');
            }

            // Validate tee boxes
            const validTeeBoxes = teeBoxes.filter(tee => tee.name.trim() && tee.color.trim() && tee.holes.length === 18);
            if (validTeeBoxes.length === 0) {
                throw new Error('Each tee box must have a name, color, and 18 holes');
            }

            // Prepare course data
            const courseData = {
                name: courseName,
                location: courseLocation,
                description: courseDescription,
                teeBoxes: validTeeBoxes
            };

            // Submit the course
            const result = await addCourse(courseData);

            // Success
            setMessage(`Course "${result.name}" added successfully!`);

            // Reset form
            setCourseName('');
            setCourseLocation('');
            setCourseDescription('');
            setTeeBoxes([{ name: '', color: '', holes: [] }]);
            setShowForm(false);

            // Reload courses
            loadCourses();

        } catch (err) {
            setError(err.message || 'Failed to add course');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Handle JSON file upload
    const handleJsonUpload = async (e) => {
        e.preventDefault();
        if (!jsonFile) {
            setError('Please select a JSON file');
            return;
        }

        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const result = await uploadJsonCourses(jsonFile);
            setMessage(`Successfully uploaded ${result.course_ids.length} courses from JSON!`);
            setJsonFile(null);

            // Reload courses
            loadCourses();
        } catch (err) {
            setError(err.message || 'Failed to upload JSON file');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Handle CSV file upload
    const handleCsvUpload = async (e) => {
        e.preventDefault();
        if (!csvFile) {
            setError('Please select a CSV file');
            return;
        }

        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const result = await uploadCsvCourses(csvFile);
            setMessage(`Successfully uploaded ${result.course_ids.length} courses from CSV!`);
            setCsvFile(null);

            // Reload courses
            loadCourses();
        } catch (err) {
            setError(err.message || 'Failed to upload CSV file');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>Course Administration</h1>
                <p>Add and manage golf courses for The Card</p>
            </div>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <div className="admin-actions">
                <button
                    className={`action-button ${showForm ? 'active' : ''}`}
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'Hide Form' : 'Add New Course'}
                </button>
                <button className="action-button" onClick={loadCourses} disabled={loading}>
                    Refresh Courses
                </button>
            </div>

            {showForm && (
                <div className="course-form-container">
                    <h2>Add New Course</h2>
                    <form onSubmit={handleSubmitForm} className="course-form">
                        <div className="form-section">
                            <h3>Course Details</h3>
                            <div className="form-group">
                                <label htmlFor="courseName">Course Name *</label>
                                <input
                                    id="courseName"
                                    type="text"
                                    value={courseName}
                                    onChange={(e) => setCourseName(e.target.value)}
                                    required
                                    placeholder="Enter course name"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="courseLocation">Location</label>
                                <input
                                    id="courseLocation"
                                    type="text"
                                    value={courseLocation}
                                    onChange={(e) => setCourseLocation(e.target.value)}
                                    placeholder="City, Country"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="courseDescription">Description</label>
                                <textarea
                                    id="courseDescription"
                                    value={courseDescription}
                                    onChange={(e) => setCourseDescription(e.target.value)}
                                    placeholder="Brief description of the course"
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Tee Boxes</h3>
                            {teeBoxes.map((teeBox, index) => (
                                <div key={index} className="tee-box-form">
                                    <div className="tee-box-header">
                                        <h4>Tee Box {index + 1}</h4>
                                        <button
                                            type="button"
                                            className="remove-button"
                                            onClick={() => removeTeeBox(index)}
                                            disabled={teeBoxes.length <= 1}
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <div className="tee-box-fields">
                                        <div className="form-group">
                                            <label htmlFor={`teeName${index}`}>Tee Name *</label>
                                            <input
                                                id={`teeName${index}`}
                                                type="text"
                                                value={teeBox.name}
                                                onChange={(e) => handleTeeBoxChange(index, 'name', e.target.value)}
                                                required
                                                placeholder="Championship, Club, etc."
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor={`teeColor${index}`}>Tee Color *</label>
                                            <input
                                                id={`teeColor${index}`}
                                                type="text"
                                                value={teeBox.color}
                                                onChange={(e) => handleTeeBoxChange(index, 'color', e.target.value)}
                                                required
                                                placeholder="Black, Blue, Red, etc."
                                            />
                                        </div>
                                    </div>

                                    <div className="holes-section">
                                        <div className="holes-header">
                                            <h5>Holes ({teeBox.holes.length}/18)</h5>
                                            <button
                                                type="button"
                                                className="generate-button"
                                                onClick={() => generateHoles(index)}
                                            >
                                                Auto-Generate Holes
                                            </button>
                                        </div>

                                        {teeBox.holes.length > 0 && (
                                            <div className="holes-summary">
                                                Total Distance: {teeBox.holes.reduce((sum, hole) => sum + hole.distance, 0)} yards
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                className="add-button"
                                onClick={addTeeBox}
                            >
                                Add Another Tee Box
                            </button>
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="submit-button"
                                disabled={loading}
                            >
                                {loading ? 'Adding...' : 'Add Course'}
                            </button>
                            <button
                                type="button"
                                className="cancel-button"
                                onClick={() => setShowForm(false)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="file-upload-section">
                <h2>Upload Course Data</h2>

                <div className="upload-cards">
                    <div className="upload-card">
                        <h3>Upload JSON</h3>
                        <p>Upload a JSON file with course data</p>
                        <form onSubmit={handleJsonUpload}>
                            <div className="file-input-group">
                                <input
                                    type="file"
                                    id="jsonFile"
                                    accept=".json"
                                    onChange={(e) => setJsonFile(e.target.files[0])}
                                />
                                <button
                                    type="submit"
                                    className="upload-button"
                                    disabled={!jsonFile || loading}
                                >
                                    Upload JSON
                                </button>
                            </div>
                        </form>
                        <div className="file-format-info">
                            <h4>JSON Format Example:</h4>
                            <pre>
                {`{
  "name": "Course Name",
  "location": "City, Country",
  "description": "Course description",
  "teeBoxes": [
    {
      "name": "Championship",
      "color": "Black",
      "holes": [
        { "number": 1, "distance": 350, "par": 4, "hcp_index": 5 },
        ...
      ]
    }
  ]
}`}
              </pre>
                        </div>
                    </div>

                    <div className="upload-card">
                        <h3>Upload CSV</h3>
                        <p>Upload a CSV file with course data</p>
                        <form onSubmit={handleCsvUpload}>
                            <div className="file-input-group">
                                <input
                                    type="file"
                                    id="csvFile"
                                    accept=".csv"
                                    onChange={(e) => setCsvFile(e.target.files[0])}
                                />
                                <button
                                    type="submit"
                                    className="upload-button"
                                    disabled={!csvFile || loading}
                                >
                                    Upload CSV
                                </button>
                            </div>
                        </form>
                        <div className="file-format-info">
                            <h4>CSV Format:</h4>
                            <p>CSV file should have the following headers:</p>
                            <code>course_name,location,description,tee_name,tee_color,hole_number,distance,par,hcp_index</code>
                            <p>Each row represents a hole on a specific tee box.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="courses-list-section">
                <h2>Existing Courses ({courses.length})</h2>
                {loading ? (
                    <div className="loading">Loading courses...</div>
                ) : (
                    <div className="courses-grid">
                        {courses.map(course => (
                            <div key={course.id} className="course-card">
                                <h3>{course.name}</h3>
                                <p className="course-location">{course.location || 'No location specified'}</p>
                                <p className="course-description">{course.description || 'No description available'}</p>
                            </div>
                        ))}
                        {courses.length === 0 && (
                            <div className="no-courses">No courses found. Add a course to get started.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminPage;