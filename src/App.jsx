import { useState } from 'react'
import './App.css'
import ScoreCard from './components/ScoreCard'
import HandicapInput from './components/HandicapInput'
import ScoreSummary from './components/ScoreSummary'

function App() {
    const [handicap, setHandicap] = useState(0)
    const [scores, setScores] = useState(Array(18).fill(0))

    const updateScore = (holeIndex, score) => {
        const newScores = [...scores]
        newScores[holeIndex] = score
        setScores(newScores)
    }

    return (
        <div className="app">
            <h1>Golf Scorecard</h1>
            <HandicapInput handicap={handicap} setHandicap={setHandicap} />
            <ScoreCard scores={scores} updateScore={updateScore} />
            <ScoreSummary scores={scores} handicap={handicap} />
        </div>
    )
}

export default App