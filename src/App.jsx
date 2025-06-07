import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import './App.css'
import ScoreCard from './components/ScoreCard'
import HandicapInput from './components/HandicapInput'
import ScoreSummary from './components/ScoreSummary'
import CourseInfo from './components/CourseInfo'
import ThemeToggle from "./components/ThemeToggle.jsx"
import AdminPage from './components/AdminPage'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'
import RoundsHistory from './components/RoundsHistory'
import { AuthProvider, useAuth } from './components/AuthContext'
import {checkDatabase, fetchAllCourses, fetchCourseById, seedDatabase} from './api/courseApi'
import { saveRound } from './api/authApi'
import SettingsPanel from "./components/SettingsPanel.jsx";

// Protected route component
const ProtectedRoute = ({ children }) => {
    const { isLoggedIn } = useAuth();

    if (!isLoggedIn) {
        return <Navigate to="/login" />;
    }

    return children;
};

function MainApp() {
    const [availableCourses, setAvailableCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [resetTrigger, setResetTrigger] = useState(0);
    const { isLoggedIn, logout } = useAuth();

    // Initialize state from localStorage if available, otherwise use defaults
    const [handicap, setHandicap] = useState(() => {
        const savedHandicap = localStorage.getItem('handicap');
        return savedHandicap ? Number(savedHandicap) : 0;
    });
    const handleLogout = () => {
        resetSession(); // Clear current session data
        logout(); // Call your existing logout function
        // Navigation will happen automatically due to the ProtectedRoute
    };

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
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

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

    useEffect(() => {
        const initDb = async () => {
            console.log("Checking database status");
            try {
                // First check if the database already has courses
                const dbStatus = await checkDatabase();

                if (dbStatus.has_courses) {
                    console.log("Database already has courses, skipping seed");
                    setDatabaseInitialized(true);

                    // Load available courses immediately
                    const courses = await fetchAllCourses();
                    setAvailableCourses(courses);

                    // Reset selected course if it doesn't exist
                    if (selectedCourseId) {
                        const courseExists = courses.some(course => course.id === Number(selectedCourseId));
                        if (!courseExists) {
                            console.log(`Selected course ID ${selectedCourseId} not found, resetting`);
                            localStorage.removeItem('selectedCourseId');
                            setSelectedCourseId(courses.length > 0 ? courses[0].id : null);
                        }
                    } else if (courses.length > 0) {
                        setSelectedCourseId(courses[0].id);
                    }
                } else {
                    console.log("Database is empty, seeding with initial data");
                    await seedDatabase();
                    console.log("Database seeded successfully");
                    setDatabaseInitialized(true);

                    // Load available courses after seeding
                    const courses = await fetchAllCourses();
                    setAvailableCourses(courses);

                    // Set first course as selected
                    if (courses.length > 0) {
                        setSelectedCourseId(courses[0].id);
                    }
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
// In the useEffect that fetches course details
    useEffect(() => {
        const loadCourseDetails = async () => {
            if (!selectedCourseId) return;

            try {
                setLoading(true);
                const courseDetails = await fetchCourseById(selectedCourseId);

                // Set selected course
                setSelectedCourse(courseDetails);

                // Update tee box selection
                if (courseDetails.teeBoxes && courseDetails.teeBoxes.length > 0) {
                    // Find tee box by ID or default to first one
                    const teeBox = courseDetails.teeBoxes.find(tee => tee.id === selectedTeeBoxId)
                        || courseDetails.teeBoxes[0];

                    setSelectedTeeBox(teeBox);
                    setSelectedTeeBoxId(teeBox.id);
                }

                setError(null);
            } catch (err) {
                console.error('Error fetching course ' + selectedCourseId + ':', err);

                // If course not found, reset to a valid course ID
                if (err.message?.includes('not found') || err.status === 404) {
                    console.log('Course not found, resetting to available courses');
                    localStorage.removeItem('selectedCourseId');

                    // Set to first available course if we have any
                    if (availableCourses.length > 0) {
                        setSelectedCourseId(availableCourses[0].id);
                    } else {
                        // If no courses available, clear selection
                        setSelectedCourseId(null);
                    }
                } else {
                    setError('Failed to load course details. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        loadCourseDetails();
    }, [selectedCourseId, availableCourses]);

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
    };

    // Save the current round to the server
    const handleSaveRound = async () => {
        // Check if the user is logged in
        if (!isLoggedIn) {
            setSaveError('You must be logged in to save a round');
            return;
        }

        // Check if there are enough completed holes (at least 9)
        const completedHoles = scores.filter(score => score > 0).length;
        if (completedHoles < 9) {
            setSaveError('You must complete at least 9 holes to save a round');
            return;
        }

        setIsSaving(true);
        setSaveError('');

        try {
            const today = new Date().toISOString().split('T')[0];

            // Get statistics from localStorage
            const puttCounts = JSON.parse(localStorage.getItem('puttCounts') || '[]');
            const girCounts = JSON.parse(localStorage.getItem('girCounts') || '[]');
            const fairwayHits = JSON.parse(localStorage.getItem('fairwayHits') || '[]');
            const bunkerCounts = JSON.parse(localStorage.getItem('bunkerCounts') || '[]');

            await saveRound({
                course_id: selectedCourseId,
                tee_box_id: selectedTeeBoxId,
                date: today,
                scores: scores,
                putts: puttCounts,
                gir: girCounts,
                fairways: fairwayHits,
                bunkers: bunkerCounts
            });

            // Reset the form after successful save
            resetSession();

            // Show success message
            alert('Round saved successfully!');
        } catch (error) {
            console.error('Error saving round:', error);
            setSaveError(error.message || 'Failed to save round');
        } finally {
            setIsSaving(false);
        }
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
                <SettingsPanel
                    isLoggedIn={isLoggedIn}
                    logout={handleLogout}
                    resetSession={resetSession}
                    handicap={handicap}
                    setHandicap={setHandicap}
                    handleSaveRound={handleSaveRound}
                    isSaving={isSaving}
                />
            </div>

            {saveError && <div className="save-error">{saveError}</div>}

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
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/" element={
                        <ProtectedRoute>
                            <MainApp />
                        </ProtectedRoute>
                    } />
                    <Route path="/rounds" element={
                        <ProtectedRoute>
                            <RoundsHistory />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                        <ProtectedRoute>
                            <AdminPage />
                        </ProtectedRoute>
                    } />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;