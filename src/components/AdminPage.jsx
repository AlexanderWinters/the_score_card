import React, { useState, useEffect } from 'react';
import { fetchAllCourses, addCourse, updateCourse, toggleCourseActive, uploadJsonCourses, uploadCsvCourses, fetchCourseById } from '../api/courseApi';
import '../styles/adminPage.css';
import { Link } from "react-router-dom";

function AdminPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [showInactive, setShowInactive] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [courseName, setCourseName] = useState('');
    const [courseLocation, setCourseLocation] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [teeBoxes, setTeeBoxes] = useState([{ name: '', holes: [] }]);

    const [jsonFile, setJsonFile] = useState(null);
    const [csvFile, setCsvFile] = useState(null);

    useEffect(() => {
        loadCourses();
    }, [showInactive]);

    const loadCourses = async () => {
        setLoading(true);
        try {
            const data = await fetchAllCourses(showInactive);
            setCourses(data);
        } catch (err) {
            setError('Failed to load courses');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditCourse = async (course) => {
        setLoading(true);
        setError(null);

        try {
            const fullCourseData = await fetchCourseById(course.id);
            setEditingCourse(fullCourseData.id);
            setCourseName(fullCourseData.name);
            setCourseLocation(fullCourseData.location || '');
            setCourseDescription(fullCourseData.description || '');

            if (fullCourseData.teeBoxes && fullCourseData.teeBoxes.length > 0) {
                const formattedTeeBoxes = fullCourseData.teeBoxes.map(tee => ({
                    name: tee.name,
                    holes: tee.holes.map(hole => ({
                        ...hole,
                        parManuallySet: true
                    }))
                }));
                setTeeBoxes(formattedTeeBoxes);
            } else {
                setTeeBoxes([{ name: '', holes: [] }]);
            }

            setIsModalOpen(true);
        } catch (err) {
            setError(err.message || 'Failed to load course details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNewCourse = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleToggleActive = async (courseId) => {
        setLoading(true);
        try {
            await toggleCourseActive(courseId);
            setMessage('Course status updated successfully!');
            loadCourses();
        } catch (err) {
            setError('Failed to update course status');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTeeBoxChange = (index, field, value) => {
        const updatedTeeBoxes = [...teeBoxes];
        updatedTeeBoxes[index][field] = value;
        setTeeBoxes(updatedTeeBoxes);
    };

    const addTeeBox = () => {
        setTeeBoxes([...teeBoxes, { name: '', holes: [] }]);
    };

    const removeTeeBox = (index) => {
        const updatedTeeBoxes = [...teeBoxes];
        updatedTeeBoxes.splice(index, 1);
        setTeeBoxes(updatedTeeBoxes);
    };

    const resetForm = () => {
        setEditingCourse(null);
        setCourseName('');
        setCourseLocation('');
        setCourseDescription('');
        setTeeBoxes([{ name: '', holes: [] }]);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (!courseName.trim()) {
                throw new Error('Course name is required');
            }

            if (teeBoxes.length === 0) {
                throw new Error('At least one tee box is required');
            }

            const validTeeBoxes = teeBoxes.filter(tee => {
                if (!tee.name.trim()) return false;

                if (tee.holes.length !== 18) return false;

                return tee.holes.every(hole =>
                    hole.number > 0 &&
                    hole.distance > 0 &&
                    hole.par >= 3 &&
                    hole.par <= 5 &&
                    hole.hcp_index >= 1 &&
                    hole.hcp_index <= 18
                );
            });

            if (validTeeBoxes.length === 0) {
                throw new Error('Each tee box must have a name and 18 holes with valid details');
            }

            const cleanedTeeBoxes = validTeeBoxes.map(teeBox => ({
                ...teeBox,
                holes: teeBox.holes.map(hole => ({
                    number: hole.number,
                    distance: hole.distance,
                    par: hole.par,
                    hcp_index: hole.hcp_index
                }))
            }));

            const courseData = {
                name: courseName,
                location: courseLocation,
                description: courseDescription,
                teeBoxes: cleanedTeeBoxes
            };

            let result;
            if (editingCourse) {
                result = await updateCourse(editingCourse, courseData);
                setMessage(`Course "${result.name}" updated successfully!`);
            } else {
                result = await addCourse(courseData);
                setMessage(`Course "${result.name}" added successfully!`);
            }

            closeModal();
            loadCourses();

        } catch (err) {
            setError(err.message || 'Failed to process course');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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

            loadCourses();
        } catch (err) {
            setError(err.message || 'Failed to upload JSON file');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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

            loadCourses();
        } catch (err) {
            setError(err.message || 'Failed to upload CSV file');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    const handleOutsideClick = (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal();
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
                    className="action-button"
                    onClick={handleAddNewCourse}
                >
                    Add New Course
                </button>
                <button className="action-button" onClick={loadCourses} disabled={loading}>
                    Refresh Courses
                </button>
                <Link to="/" className="action-button back">Back to App</Link>
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={handleOutsideClick}>
                    <div className="modal-container">
                        <div className="modal-header">
                            <h2>{editingCourse ? 'Edit Course' : 'Add New Course'}</h2>
                            <button className="close-button" onClick={closeModal}>×</button>
                        </div>
                        <div className="modal-body">
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
                                            </div>

                                            <div className="holes-section">
                                                <div className="holes-header">
                                                    <h5>Holes ({teeBox.holes.length}/18)</h5>
                                                </div>

                                                {teeBox.holes.length > 0 ? (
                                                    <div className="holes-table">
                                                        <table className="hole-details-table">
                                                            <thead>
                                                            <tr>
                                                                <th>Hole</th>
                                                                <th>Distance (meters)</th>
                                                                <th>Par</th>
                                                                <th>Handicap Index</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {teeBox.holes.map((hole, holeIndex) => (
                                                                <tr key={holeIndex}>
                                                                    <td>{hole.number}</td>
                                                                    <td>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            value={hole.distance || ''}
                                                                            onChange={(e) => {
                                                                                const distance = Number(e.target.value);
                                                                                const updatedTeeBoxes = [...teeBoxes];
                                                                                updatedTeeBoxes[index].holes[holeIndex].distance = distance;

                                                                                if (distance > 0) {
                                                                                    let suggestedPar;
                                                                                    if (distance <= 200) suggestedPar = 3;
                                                                                    else if (distance <= 380) suggestedPar = 4;
                                                                                    else suggestedPar = 5;

                                                                                    if (!updatedTeeBoxes[index].holes[holeIndex].parManuallySet) {
                                                                                        updatedTeeBoxes[index].holes[holeIndex].par = suggestedPar;
                                                                                    }
                                                                                }

                                                                                setTeeBoxes(updatedTeeBoxes);
                                                                            }}
                                                                            required
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <select
                                                                            value={hole.par || 4}
                                                                            onChange={(e) => {
                                                                                const updatedTeeBoxes = [...teeBoxes];
                                                                                updatedTeeBoxes[index].holes[holeIndex].par = Number(e.target.value);
                                                                                updatedTeeBoxes[index].holes[holeIndex].parManuallySet = true;
                                                                                setTeeBoxes(updatedTeeBoxes);
                                                                            }}
                                                                            required
                                                                        >
                                                                            <option value={3}>3</option>
                                                                            <option value={4}>4</option>
                                                                            <option value={5}>5</option>
                                                                        </select>
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            max="18"
                                                                            value={hole.hcp_index || ''}
                                                                            onChange={(e) => {
                                                                                const updatedTeeBoxes = [...teeBoxes];
                                                                                updatedTeeBoxes[index].holes[holeIndex].hcp_index = Number(e.target.value);
                                                                                setTeeBoxes(updatedTeeBoxes);
                                                                            }}
                                                                            required
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            </tbody>
                                                        </table>
                                                        <div className="holes-summary">
                                                            Total Distance: {teeBox.holes.reduce((sum, hole) => sum + (hole.distance || 0), 0)} meters
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="add-holes-container">
                                                        <button
                                                            type="button"
                                                            className="add-holes-button"
                                                            onClick={() => {
                                                                const updatedTeeBoxes = [...teeBoxes];
                                                                const holes = [];

                                                                for (let i = 1; i <= 18; i++) {
                                                                    holes.push({
                                                                        number: i,
                                                                        distance: 0,
                                                                        par: 4,
                                                                        hcp_index: i,
                                                                        parManuallySet: false
                                                                    });
                                                                }

                                                                updatedTeeBoxes[index].holes = holes;
                                                                setTeeBoxes(updatedTeeBoxes);
                                                            }}
                                                        >
                                                            Add Holes
                                                        </button>
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
                                        {loading ? (editingCourse ? 'Updating...' : 'Adding...') : (editingCourse ? 'Update Course' : 'Add Course')}
                                    </button>
                                    <button
                                        type="button"
                                        className="cancel-button"
                                        onClick={closeModal}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
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
                            <code>course_name,location,description,tee_name,hole_number,distance,par,hcp_index</code>
                            <p>Each row represents a hole on a specific tee box.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="courses-list-section">
                <div className="courses-header">
                    <h2>Existing Courses ({courses.length})</h2>
                    <label className="toggle-inactive">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={() => setShowInactive(!showInactive)}
                        />
                        Show Inactive Courses
                    </label>
                </div>
                {loading ? (
                    <div className="loading">Loading courses...</div>
                ) : (
                    <div className="courses-grid">
                        {courses.map(course => (
                            <div key={course.id} className={`course-card ${!course.active ? 'inactive' : ''}`}>
                                <h3>{course.name}</h3>
                                <p className="course-location">{course.location || 'No location specified'}</p>
                                <p className="course-description">{course.description || 'No description available'}</p>
                                <div className="course-status">
                                    Status: {course.active ? 'Active' : 'Inactive'}
                                </div>
                                <div className="course-actions">
                                    <button
                                        className="edit-button"
                                        onClick={() => handleEditCourse(course)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className={`toggle-button ${!course.active ? 'activate' : 'deactivate'}`}
                                        onClick={() => handleToggleActive(course.id)}
                                    >
                                        {course.active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
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