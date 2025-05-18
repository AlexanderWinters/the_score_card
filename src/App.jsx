// src/App.jsx
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import ScoreCard from './components/ScoreCard'
import HandicapInput from './components/HandicapInput'
import ScoreSummary from './components/ScoreSummary'
import CourseInfo from './components/CourseInfo'
import ThemeToggle from "./components/ThemeToggle.jsx"
import AdminPage from './components/AdminPage'
import {checkDatabase, fetchAllCourses, fetchCourseById, seedDatabase} from './api/courseApi'

function MainApp() {
    const [availableCourses, setAvailableCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [resetTrigger, setResetTrigger] = useState(0);


    // Initialize state from localStorage if available, otherwise use defaults
    const [handicap, setHandicap] = useState(() => {
        const savedHandicap = localStorage.getItem('handicap');
        return savedHandicap ? Number(savedHandicap) : 0;
    });

    const [playerName, setPlayerName] = useState(() => {
        return localStorage.getItem('playerName') || 'Player 1';
    });

    const [selectedCourseId, setSelectedCourseId] = useState(() => {
        return localStorage.getItem('selectedCourseId') || null;
    });

    const [scores, setScores] = useState(() => {
        const savedScores = localStorage.getItem('scores');
        return savedScores ? JSON.parse(savedScores) : Array(18).fill(0);
    });

    const [selectedTeeBoxId, setSelectedTeeBoxId] = useState(() => {
        return localStorage.getItem('selectedTeeBoxId') || null;
    });

    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedTeeBox, setSelectedTeeBox] = useState(null);
    const [databaseInitialized, setDatabaseInitialized] = useState(false);

    const [darkMode, setDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme === 'dark';
        } else {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
    });

    // Save state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('handicap', handicap.toString());
    }, [handicap]);

    useEffect(() => {
        localStorage.setItem('playerName', playerName);
    }, [playerName]);

    useEffect(() => {
        if (selectedCourseId) {
            localStorage.setItem('selectedCourseId', selectedCourseId);
        }
    }, [selectedCourseId]);

    useEffect(() => {
        localStorage.setItem('scores', JSON.stringify(scores));
    }, [scores]);

    useEffect(() => {
        if (selectedTeeBoxId) {
            localStorage.setItem('selectedTeeBoxId', selectedTeeBoxId);
        }
    }, [selectedTeeBoxId]);

    // Initialize the database with seed data when app first loads
    useEffect(() => {
        const initDb = async () => {
            console.log("Checking database status");
            try {
                // First check if the database already has courses
                const dbStatus = await checkDatabase();

                if (dbStatus.has_courses) {
                    // Database already has courses, no need to seed
                    console.log("Database already has courses, skipping seed");
                    setDatabaseInitialized(true);
                } else {
                    // Database is empty, we need to seed it
                    console.log("Database is empty, seeding with initial data");
                    await seedDatabase();
                    console.log("Database seeded successfully");
                    setDatabaseInitialized(true);
                }
            } catch (err) {
                console.error('Failed to initialize database:', err);
                setError('Failed to initialize the database. Please try again later.');
            }
        };

        initDb();
    }, []);

    // Fetch all courses when database is initialized
    useEffect(() => {
        if (!databaseInitialized) return;

        const loadCourses = async () => {
            try {
                setLoading(true);
                const courses = await fetchAllCourses();
                setAvailableCourses(courses);

                // Only set default course if no course is selected yet
                if (courses.length > 0 && !selectedCourseId) {
                    setSelectedCourseId(courses[0].id);
                }

                setError(null);
            } catch (err) {
                setError('Failed to load courses. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadCourses();
    }, [databaseInitialized, selectedCourseId]);

    // Fetch selected course details when selectedCourseId changes
    useEffect(() => {
        const loadCourseDetails = async () => {
            if (!selectedCourseId) return;

            try {
                setLoading(true);
                const courseDetails = await fetchCourseById(selectedCourseId);
                console.log('Raw course details:', JSON.stringify(courseDetails, null, 2));

                setSelectedCourse(courseDetails);

                if (courseDetails.teeBoxes && courseDetails.teeBoxes.length > 0) {
                    // Find tee box by ID or default to first one
                    const teeBox = courseDetails.teeBoxes.find(tee => tee.id === selectedTeeBoxId)
                        || courseDetails.teeBoxes[0];

                    setSelectedTeeBox(teeBox);
                    setSelectedTeeBoxId(teeBox.id);
                }

                setError(null);
            } catch (err) {
                setError('Failed to load course details. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadCourseDetails();
    }, [selectedCourseId]);

    // Update selected tee box when teeBoxId changes
    useEffect(() => {
        if (selectedCourse && selectedCourse.teeBoxes) {
            const teeBox = selectedCourse.teeBoxes.find(tee => tee.id === selectedTeeBoxId);
            if (teeBox) {
                setSelectedTeeBox(teeBox);
            }
        }
    }, [selectedTeeBoxId, selectedCourse]);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    // Modified: Only reset scores when changing courses if we don't have saved scores for this course
    useEffect(() => {
        // Check if we're loading a saved session, if not, reset scores
        const savedCourseId = localStorage.getItem('lastCourseId');
        if (selectedCourseId !== savedCourseId) {
            setScores(Array(18).fill(0));
            localStorage.setItem('lastCourseId', selectedCourseId);

            // Reset putt and gir counts
            localStorage.removeItem('puttCounts');
            localStorage.removeItem('girCounts');

        }
    }, [selectedCourseId]);

    const updateScore = (holeIndex, score) => {
        const newScores = [...scores];
        newScores[holeIndex] = score;
        setScores(newScores);
    };

    // Add reset session function
    const resetSession = () => {
        // Reset state to defaults
        setHandicap(0);
        setPlayerName('Player 1');
        setScores(Array(18).fill(0));

        setResetTrigger(prev => prev + 1);


        // Clear localStorage of session data
        localStorage.removeItem('handicap');
        localStorage.removeItem('playerName');
        localStorage.removeItem('scores');
        localStorage.removeItem('lastCourseId');
        localStorage.removeItem('puttCounts');
        localStorage.removeItem('girCounts');


        // We're keeping the course selection because that's a preference
        // but we could reset it too if desired
    };

    if (loading && !selectedCourse) {
        return <div className="loading">Loading courses...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    // Instead of showing a "Select a course" message, automatically select the first course
    if (!selectedCourse || !selectedTeeBox) {
        // Check if courses are available but none is selected
        if (availableCourses.length > 0) {
            // If we have courses but no selection, select the first one
            // This should trigger the useEffect that loads course details
            // We can return a loading indicator during this process
            return <div className="loading">Loading course details...</div>;
        } else {
            // If no courses are available at all
            return <div className="loading">No courses available</div>;
        }
    }

    return (
        <div className="app">
            <div className="app-header">
                <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
                <h1>The Card</h1>
                <div className="header-links">
                    <button
                        className="reset-session-button"
                        onClick={resetSession}
                        title="Reset current scorecard"
                    >
                        New Round
                    </button>
                    <Link to="/admin" className="admin-link">Admin</Link>
                </div>
            </div>

            <div className="top-section">
                <CourseInfo
                    availableCourses={availableCourses}
                    selectedCourseId={selectedCourseId}
                    setSelectedCourseId={setSelectedCourseId}
                    selectedTeeBoxId={selectedTeeBoxId}
                    setSelectedTeeBoxId={setSelectedTeeBoxId}
                    playerName={playerName}
                    setPlayerName={setPlayerName}
                    selectedCourse={selectedCourse}
                />

                <ScoreSummary
                    scores={scores}
                    handicap={handicap}
                    courseData={selectedTeeBox}
                    courseName={selectedCourse.name}
                />
            </div>

            <HandicapInput handicap={handicap} setHandicap={setHandicap} />

            <ScoreCard
                scores={scores}
                updateScore={updateScore}
                courseData={selectedTeeBox}
                handicap={handicap}
                playerName={playerName}
                resetPuttsAndGIR={resetTrigger}

            />
        </div>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainApp />} />
                <Route path="/admin" element={<AdminPage />} />
            </Routes>
        </Router>
    );
}

export default App;