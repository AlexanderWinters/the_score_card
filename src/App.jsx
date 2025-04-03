import { useState, useEffect } from 'react'
import './App.css'
import ScoreCard from './components/ScoreCard'
import HandicapInput from './components/HandicapInput'
import ScoreSummary from './components/ScoreSummary'
import CourseInfo from './components/CourseInfo'

function App() {
    // Placeholder course data for 5 Swedish golf courses
    const availableCourses = [
        {
            id: 1,
            name: "Bro Hof Slott GC",
            holes: Array(18).fill().map((_, i) => ({
                number: i + 1,
                distance: 165 + (i * 15), // Longer championship course
                par: i % 4 === 0 ? 5 : (i % 4 === 2 ? 3 : 4), // Mix of par 3, 4, and 5
                hcpIndex: ((i * 7) % 18) + 1 // Handicap index distribution
            }))
        },
        {
            id: 2,
            name: "Ullna Golf Club",
            holes: Array(18).fill().map((_, i) => ({
                number: i + 1,
                distance: 150 + (i * 12),
                par: i % 4 === 1 ? 5 : (i % 4 === 3 ? 3 : 4),
                hcpIndex: ((i * 5) % 18) + 1
            }))
        },
        {
            id: 3,
            name: "Halmstad GK (North)",
            holes: Array(18).fill().map((_, i) => ({
                number: i + 1,
                distance: 145 + (i * 13),
                par: i % 3 === 0 ? 5 : (i % 5 === 0 ? 3 : 4),
                hcpIndex: ((i * 3) % 18) + 1
            }))
        },
        {
            id: 4,
            name: "Falsterbo GK",
            holes: Array(18).fill().map((_, i) => ({
                number: i + 1,
                distance: 140 + (i * 14),
                par: i % 4 === 2 ? 5 : (i % 4 === 0 ? 3 : 4),
                hcpIndex: ((i * 11) % 18) + 1
            }))
        },
        {
            id: 5,
            name: "Barsebäck Golf & CC",
            holes: Array(18).fill().map((_, i) => ({
                number: i + 1,
                distance: 155 + (i * 13),
                par: i % 5 === 1 ? 5 : (i % 5 === 3 ? 3 : 4),
                hcpIndex: ((i * 9) % 18) + 1
            }))
        }
    ];

    const [handicap, setHandicap] = useState(0)
    const [playerName, setPlayerName] = useState('Player 1')
    const [selectedCourseId, setSelectedCourseId] = useState(1) // Default to first course
    const [scores, setScores] = useState(Array(18).fill(0))

    // Get the currently selected course data
    const selectedCourse = availableCourses.find(course => course.id === selectedCourseId);

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
            <h1>The Card</h1>

            <div className="top-section">
                <CourseInfo
                    availableCourses={availableCourses}
                    selectedCourseId={selectedCourseId}
                    setSelectedCourseId={setSelectedCourseId}
                    playerName={playerName}
                    setPlayerName={setPlayerName}
                />

                <ScoreSummary
                    scores={scores}
                    handicap={handicap}
                    courseData={selectedCourse}
                />
            </div>

            <HandicapInput handicap={handicap} setHandicap={setHandicap} />

            <ScoreCard
                scores={scores}
                updateScore={updateScore}
                courseData={selectedCourse}
                handicap={handicap}
                playerName={playerName}
            />
        </div>
    )
}

export default App