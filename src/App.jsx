import { useState } from 'react'
import './App.css'
import ScoreCard from './components/ScoreCard'
import HandicapInput from './components/HandicapInput'
import ScoreSummary from './components/ScoreSummary'
import CourseInfo from './components/CourseInfo'

function App() {
    const [handicap, setHandicap] = useState(0)
    const [playerName, setPlayerName] = useState('Player 1')
    const [courseName, setCourseName] = useState('Pine Valley Golf Club')
    const [scores, setScores] = useState(Array(18).fill(0))

    // Placeholder course data (in real app, this would come from API)
    const courseData = {
        holes: Array(18).fill().map((_, i) => ({
            number: i + 1,
            distance: 100 + (i * 20), // Placeholder distances
            par: i % 3 === 0 ? 5 : (i % 3 === 1 ? 4 : 3), // Mix of par 3, 4, and 5
        }))
    }

    const updateScore = (holeIndex, score) => {
        const newScores = [...scores]
        newScores[holeIndex] = score
        setScores(newScores)
    }

    return (
        <div className="app">
            <h1>Golf Scorecard</h1>

            <CourseInfo
                courseName={courseName}
                setCourseName={setCourseName}
                playerName={playerName}
                setPlayerName={setPlayerName}
            />

            <HandicapInput handicap={handicap} setHandicap={setHandicap} />

            <ScoreCard
                scores={scores}
                updateScore={updateScore}
                courseData={courseData}
                handicap={handicap}
                playerName={playerName}
            />

            <ScoreSummary
                scores={scores}
                handicap={handicap}
                courseName={courseName}
                courseData={courseData}
            />
        </div>
    )
}

export default App