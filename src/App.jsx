// src/App.jsx
import { useState, useEffect } from 'react'
import './App.css'
import ScoreCard from './components/ScoreCard'
import HandicapInput from './components/HandicapInput'
import ScoreSummary from './components/ScoreSummary'
import CourseInfo from './components/CourseInfo'
import ThemeToggle from "./components/ThemeToggle.jsx";
import { fetchAllCourses, fetchCourseById, seedDatabase } from './api/courseApi'

function App() {
    const [availableCourses, setAvailableCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [handicap, setHandicap] = useState(0);
    const [playerName, setPlayerName] = useState('Player 1');
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [scores, setScores] = useState(Array(18).fill(0));
    const [selectedTeeBoxId, setSelectedTeeBoxId] = useState(null);

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

    // Initialize the database with seed data when app first loads
    useEffect(() => {
        const initDb = async () => {
            console.log("Starting database initialization");
            try {
                await seedDatabase();
                console.log("Database seeded successfully");
                setDatabaseInitialized(true);
            } catch (err) {
                console.error('Failed to seed database:', err);
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

                if (courses.length > 0) {
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
    }, [databaseInitialized]);

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

    // Reset scores when changing courses
    useEffect(() => {
        setScores(Array(18).fill(0));
    }, [selectedCourseId]);

    const updateScore = (holeIndex, score) => {
        const newScores = [...scores];
        newScores[holeIndex] = score;
        setScores(newScores);
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
            <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
            <h1>The Card</h1>

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
            />
        </div>
    );
}

export default App;