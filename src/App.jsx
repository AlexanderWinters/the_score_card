import { useState, useEffect } from 'react'
import './App.css'
import ScoreCard from './components/ScoreCard'
import HandicapInput from './components/HandicapInput'
import ScoreSummary from './components/ScoreSummary'
import CourseInfo from './components/CourseInfo'
import ThemeToggle from "./components/ThemeToggle.jsx";

function App() {
    // Placeholder course data for 5 Swedish golf courses
    const availableCourses = [
        {
            id: 1,
            name: "Bro Hof Slott GC",
            teeBoxes: [
                {
                    id: 1,
                    name: "Championship",
                    color: "Black",
                    holes: Array(18).fill().map((_, i) => ({
                        number: i + 1,
                        distance: 165 + (i * 15), // Longer championship course
                        par: i % 4 === 0 ? 5 : (i % 4 === 2 ? 3 : 4),
                        hcpIndex: ((i * 7) % 18) + 1
                    }))
                },
                {
                    id: 2,
                    name: "Club",
                    color: "Blue",
                    holes: Array(18).fill().map((_, i) => ({
                        number: i + 1,
                        distance: 150 + (i * 13), // Slightly shorter
                        par: i % 4 === 0 ? 5 : (i % 4 === 2 ? 3 : 4),
                        hcpIndex: ((i * 7) % 18) + 1 // Same handicap index distribution
                    }))
                },
                {
                    id: 3,
                    name: "Forward",
                    color: "Red",
                    holes: Array(18).fill().map((_, i) => ({
                        number: i + 1,
                        distance: 130 + (i * 10), // Shortest tees
                        par: i % 4 === 0 ? 5 : (i % 4 === 2 ? 3 : 4),
                        hcpIndex: ((i * 7) % 18) + 1
                    }))
                }
            ]

        },
        {
            id: 2,
            name: "Ullna Golf Club",
            teeBoxes: [
                {
                    id: 1,
                    name: "Championship",
                    color: "Black",
                    holes: Array(18).fill().map((_, i) => ({
                        number: i + 1,
                        distance: 150 + (i * 12),
                        par: i % 4 === 1 ? 5 : (i % 4 === 3 ? 3 : 4),
                        hcpIndex: ((i * 5) % 18) + 1
                    }))
                },
                // Add other tee boxes
                {
                    id: 2,
                    name: "Club",
                    color: "Blue",
                    holes: Array(18).fill().map((_, i) => ({
                        number: i + 1,
                        distance: 140 + (i * 10),
                        par: i % 4 === 1 ? 5 : (i % 4 === 3 ? 3 : 4),
                        hcpIndex: ((i * 5) % 18) + 1
                    }))
                },
                {
                    id: 3,
                    name: "Forward",
                    color: "Red",
                    holes: Array(18).fill().map((_, i) => ({
                        number: i + 1,
                        distance: 120 + (i * 9),
                        par: i % 4 === 1 ? 5 : (i % 4 === 3 ? 3 : 4),
                        hcpIndex: ((i * 5) % 18) + 1
                    }))
                }
            ]

        },
        {
            id: 3,
            name: "Halmstad GK (North)",
            teeBoxes: [
                {
                    id: 1,
                    name: "Championship",
                    color: "Black",
                    holes: Array(18).fill().map((_, i) => ({
                        number: i + 1,
                        distance: 150 + (i * 12),
                        par: i % 4 === 1 ? 5 : (i % 4 === 3 ? 3 : 4),
                        hcpIndex: ((i * 5) % 18) + 1
                    }))
                },
                // Add other tee boxes
                {
                    id: 2,
                    name: "Club",
                    color: "Blue",
                    holes: Array(18).fill().map((_, i) => ({
                        number: i + 1,
                        distance: 140 + (i * 10),
                        par: i % 4 === 1 ? 5 : (i % 4 === 3 ? 3 : 4),
                        hcpIndex: ((i * 5) % 18) + 1
                    }))
                },
                {
                    id: 3,
                    name: "Forward",
                    color: "Red",
                    holes: Array(18).fill().map((_, i) => ({
                        number: i + 1,
                        distance: 120 + (i * 9),
                        par: i % 4 === 1 ? 5 : (i % 4 === 3 ? 3 : 4),
                        hcpIndex: ((i * 5) % 18) + 1
                    }))
                }
            ]

        },
        {
            id: 4,
            name: "Falsterbo GK",
            teeBoxes: [
                {
                    id: 1,
                    name: "Championship",
                    color: "Black",
                    holes: Array(18).fill().map((_, i) => ({
                        number: i + 1,
                        distance: 150 + (i * 12),
                        par: i % 4 === 1 ? 5 : (i % 4 === 3 ? 3 : 4),
                        hcpIndex: ((i * 5) % 18) + 1
                    }))
                },
                // Add other tee boxes
                {
                    id: 2,
                    name: "Club",
                    color: "Blue",
                    holes: Array(18).fill().map((_, i) => ({
                        number: i + 1,
                        distance: 140 + (i * 10),
                        par: i % 4 === 1 ? 5 : (i % 4 === 3 ? 3 : 4),
                        hcpIndex: ((i * 5) % 18) + 1
                    }))
                },
                {
                    id: 3,
                    name: "Forward",
                    color: "Red",
                    holes: Array(18).fill().map((_, i) => ({
                        number: i + 1,
                        distance: 120 + (i * 9),
                        par: i % 4 === 1 ? 5 : (i % 4 === 3 ? 3 : 4),
                        hcpIndex: ((i * 5) % 18) + 1
                    }))
                }
            ]

        },
        {
            id: 5,
            name: "Barsebäck Golf & CC",
            teeBoxes: [
                {
                    id: 1,
                    name: "Championship",
                    color: "Black",
                    holes: Array(18).fill().map((_, i) => ({
                        number: i + 1,
                        distance: 150 + (i * 12),
                        par: i % 4 === 1 ? 5 : (i % 4 === 3 ? 3 : 4),
                        hcpIndex: ((i * 5) % 18) + 1
                    }))
                },
                // Add other tee boxes
                {
                    id: 2,
                    name: "Club",
                    color: "Blue",
                    holes: Array(18).fill().map((_, i) => ({
                        number: i + 1,
                        distance: 140 + (i * 10),
                        par: i % 4 === 1 ? 5 : (i % 4 === 3 ? 3 : 4),
                        hcpIndex: ((i * 5) % 18) + 1
                    }))
                },
                {
                    id: 3,
                    name: "Forward",
                    color: "Red",
                    holes: Array(18).fill().map((_, i) => ({
                        number: i + 1,
                        distance: 120 + (i * 9),
                        par: i % 4 === 1 ? 5 : (i % 4 === 3 ? 3 : 4),
                        hcpIndex: ((i * 5) % 18) + 1
                    }))
                }
            ]

        }
    ];

    const [handicap, setHandicap] = useState(0)
    const [playerName, setPlayerName] = useState('Player 1')
    const [selectedCourseId, setSelectedCourseId] = useState(1) // Default to first course
    const [scores, setScores] = useState(Array(18).fill(0))

    const [selectedTeeBoxId, setSelectedTeeBoxId] = useState(1); // Default to first tee box

// Get the currently selected course data with the selected tee box
    const selectedCourse = availableCourses.find(course => course.id === selectedCourseId);
    const selectedTeeBox = selectedCourse.teeBoxes.find(tee => tee.id === selectedTeeBoxId);

    const [darkMode, setDarkMode] = useState(() => {
        // Check local storage for theme preference or default to system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme === 'dark';
        } else {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);



// Reset scores and possibly tee selection when changing courses
    useEffect(() => {
        setScores(Array(18).fill(0));
        // Optionally reset to first tee box when changing courses
        setSelectedTeeBoxId(1);
    }, [selectedCourseId]);

    // Get the currently selected course data

    // Reset scores when changing courses
    useEffect(() => {
        setScores(Array(18).fill(0));
    }, [selectedCourseId]);

    const updateScore = (holeIndex, score) => {
        const newScores = [...scores]
        newScores[holeIndex] = score
        setScores(newScores)
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
                />


                <ScoreSummary
                    scores={scores}
                    handicap={handicap}
                    courseData={selectedTeeBox} // Pass the selected tee box data
                    courseName={selectedCourse.name} // Pass the course name separately if needed
                />

            </div>

            <HandicapInput handicap={handicap} setHandicap={setHandicap} />

            <ScoreCard
                scores={scores}
                updateScore={updateScore}
                courseData={selectedTeeBox} // Pass the selected tee box data instead of the whole course
                handicap={handicap}
                playerName={playerName}
            />

        </div>
    )
}

export default App