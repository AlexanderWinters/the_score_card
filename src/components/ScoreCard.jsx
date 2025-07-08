import React, {useState, useEffect} from 'react'
import '../styles/scorecard.css';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';

function ScoreCard({ scores, updateScore, courseData, handicap, playerName, resetPuttsAndGIR
                   }) {
    const [puttCounts, setPuttCounts] = useState(() => {
        const savedPutts = localStorage.getItem('puttCounts');
        return savedPutts ? JSON.parse(savedPutts) : Array(18).fill(0);
    });

    const [girCounts, setGirCounts] = useState(() => {
        const savedGirs = localStorage.getItem('girCounts');
        return savedGirs ? JSON.parse(savedGirs) : Array(18).fill(false);
    });

    const [fairwayHits, setFairwayHits] = useState(() => {
        const savedFairways = localStorage.getItem('fairwayHits');
        return savedFairways ? JSON.parse(savedFairways) : Array(18).fill(false);
    });

    const [bunkerCounts, setBunkerCounts] = useState(() => {
        const savedBunkers = localStorage.getItem('bunkerCounts');
        return savedBunkers ? JSON.parse(savedBunkers) : Array(18).fill(0);
    });

    const [currentHole, setCurrentHole] = useState(null);
    const [showDetailsTable, setShowDetailsTable] = useState(() => {
        const savedPreference = localStorage.getItem('showDetailsTable');
        return savedPreference !== null ? JSON.parse(savedPreference) : true;
    });

    useEffect(() => {
        const firstUnregisteredIndex = scores.findIndex(score => score === 0);
        const nextHole = firstUnregisteredIndex !== -1
            ? courseData.holes[firstUnregisteredIndex]
            : null;
        setCurrentHole(nextHole);
    }, [scores, courseData.holes]);

    useEffect(() => {
        if (resetPuttsAndGIR) {
            setPuttCounts(Array(18).fill(0));
            setGirCounts(Array(18).fill(false));
            setFairwayHits(Array(18).fill(false));
            setBunkerCounts(Array(18).fill(0));
        }
    }, [resetPuttsAndGIR]);

    useEffect(() => {
        localStorage.setItem('puttCounts', JSON.stringify(puttCounts));
    }, [puttCounts]);

    useEffect(() => {
        localStorage.setItem('girCounts', JSON.stringify(girCounts));
    }, [girCounts]);

    useEffect(() => {
        localStorage.setItem('fairwayHits', JSON.stringify(fairwayHits));
    }, [fairwayHits]);

    useEffect(() => {
        localStorage.setItem('bunkerCounts', JSON.stringify(bunkerCounts));
    }, [bunkerCounts]);

    useEffect(() => {
        localStorage.setItem('showDetailsTable', JSON.stringify(showDetailsTable));
    }, [showDetailsTable]);

    const updatePuttCount = (index, value) => {
        const newPuttCounts = [...puttCounts];
        newPuttCounts[index] = value;
        setPuttCounts(newPuttCounts);

        const score = scores[index];
        if (score > 0 && value > 0) {
            const par = courseData.holes[index].par;
            const shotsToGreen = score - value;
            const isGir = shotsToGreen <= (par - 2);

            // Update GIR status
            updateGirCount(index, isGir);
        }
    };
    const updateBunkerCount = (index, value) => {
        const newBunkerCounts = [...bunkerCounts];
        newBunkerCounts[index] = value;
        setBunkerCounts(newBunkerCounts);
    };

    const updateGirCount = (index, value) => {
        const newGirCounts = [...girCounts];
        newGirCounts[index] = value;
        setGirCounts(newGirCounts);
    };

    const updateFairwayHit = (index, value) => {
        const newFairwayHits = [...fairwayHits];
        newFairwayHits[index] = value;
        setFairwayHits(newFairwayHits);
    };

    const handleScoreUpdate = (index, value) => {
        updateScore(index, value);

        const par = courseData.holes[index].par;
        if (value === par && puttCounts[index] === 2) {
            updateGirCount(index, true);
        }
    };

    const toggleDetailsTable = () => {
        setShowDetailsTable(!showDetailsTable);
    };

    const totalPutts = puttCounts.reduce((sum, count) => sum + count, 0);
    const totalGirs = girCounts.filter(gir => gir).length;
    const totalFairways = fairwayHits.filter(hit => hit).length;
    const totalBunkers = bunkerCounts.reduce((sum, count) => sum + count, 0);

    // Calculate net scores
    const getNetScore = (score, holeIndex) => {
        if (!score || !handicap) return '-';

        const hole = courseData.holes[holeIndex];
        // Calculate strokes received for this hole based on handicap
        const strokesReceived = hole.hcp_index <= handicap ? 1 : 0;
        return score - strokesReceived;
    };

    const getScoreType = (score, par) => {
        if (!score) return null;

        const scoreDiff = score - par;

        if (scoreDiff === 0) return "par";
        if (scoreDiff === 1) return "bogey";
        if (scoreDiff >= 2) return "double-bogey";
        if (scoreDiff === -1) return "birdie";
        if (scoreDiff <= -2) return "eagle";

        return null;
    };

    const getScoreClass = (scoreType) => {
        switch (scoreType) {
            case "bogey":
                return "score-square";
            case "double-bogey":
                return "score-double-square";
            case "birdie":
                return "score-circle";
            case "eagle":
                return "score-double-circle";
            default:
                return "";
        }
    };

    const getTextColorClass = (scoreType) => {
        if (scoreType === "bogey" || scoreType === "double-bogey") {
            return "over-par";
        } else if (scoreType === "birdie" || scoreType === "eagle") {
            return "under-par";
        }
        return "";
    };

    // Split holes into front 9 and back 9
    const frontNine = courseData.holes.slice(0, 9);
    const backNine = courseData.holes.slice(9, 18);

    // Helper function to render a scorecard section
    const renderScorecardSection = (holes, startIndex, sectionName) => {
        const sectionScores = scores.slice(startIndex, startIndex + 9);
        const sectionPar = holes.reduce((sum, hole) => sum + hole.par, 0);
        const sectionTotal = sectionScores.reduce((sum, score) => sum + score, 0);

        return (
            <div className="scorecard-section">
                <div className="section-header">{sectionName}</div>

                {/* Hole Numbers Row */}
                <div className="scorecard-row hole-number-row">
                    {holes.map((hole) => (
                        <div key={hole.number} className="hole-column">
                            <div className="hole-number">{hole.number}</div>
                        </div>
                    ))}
                    <div className="hole-column total-column">
                        <div className="hole-number">Out</div>
                    </div>
                </div>

                {/* Par Row */}
                <div className="scorecard-row">
                    {holes.map((hole, index) => (
                        <div key={index} className="hole-column">
                            <div className="hole-par">{hole.par}</div>
                        </div>
                    ))}
                    <div className="hole-column total-column">
                        <div className="hole-par">{sectionPar}</div>
                    </div>
                </div>

                {/* Score Row */}
                <div className="scorecard-row">
                    {holes.map((hole, index) => {
                        const globalIndex = startIndex + index;
                        const scoreType = getScoreType(scores[globalIndex], hole.par);
                        const scoreClass = getScoreClass(scoreType);
                        const textColorClass = getTextColorClass(scoreType);

                        return (
                            <div key={index} className="hole-column">
                                <div className="hole-score">
                                    <div className="score-container">
                                        {scoreClass ? (
                                            <div className={scoreClass}>
                                                <input
                                                    type="number"
                                                    value={scores[globalIndex] === 0 ? '' : scores[globalIndex]}
                                                    onChange={(e) => handleScoreUpdate(globalIndex, Number(e.target.value) || 0)}
                                                    min="1"
                                                    max="20"
                                                    placeholder="-"
                                                    className={`score-input ${textColorClass}`}
                                                    aria-label={`Score for hole ${globalIndex + 1}`}
                                                />
                                            </div>
                                        ) : (
                                            <input
                                                type="number"
                                                value={scores[globalIndex] === 0 ? '' : scores[globalIndex]}
                                                onChange={(e) => handleScoreUpdate(globalIndex, Number(e.target.value) || 0)}
                                                min="1"
                                                max="20"
                                                placeholder="-"
                                                className="score-input"
                                                aria-label={`Score for hole ${globalIndex + 1}`}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div className="hole-column total-column">
                        <div className="hole-score">
                            {sectionTotal || '-'}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Helper function to render details section
    const renderDetailsSection = (holes, startIndex, sectionName) => {
        const sectionPutts = puttCounts.slice(startIndex, startIndex + 9);
        const sectionGirs = girCounts.slice(startIndex, startIndex + 9);
        const sectionFairways = fairwayHits.slice(startIndex, startIndex + 9);
        const sectionBunkers = bunkerCounts.slice(startIndex, startIndex + 9);

        const sectionTotalPutts = sectionPutts.reduce((sum, count) => sum + count, 0);
        const sectionTotalGirs = sectionGirs.filter(gir => gir).length;
        const sectionTotalFairways = sectionFairways.filter(hit => hit).length;
        const sectionTotalBunkers = sectionBunkers.reduce((sum, count) => sum + count, 0);

        return (
            <div className="scorecard-section">
                <div className="section-header">{sectionName} Details</div>

                {/* Hole Numbers Row */}
                <div className="scorecard-row hole-number-row">
                    <div className="row-label">Hole</div>
                    {holes.map((hole) => (
                        <div key={hole.number} className="hole-column">
                            <div className="hole-number">{hole.number}</div>
                        </div>
                    ))}
                    <div className="hole-column total-column">
                        <div className="hole-number">Total</div>
                    </div>
                </div>

                {/* HCP Index row */}
                <div className="scorecard-row">
                    <div className="row-label">HCP</div>
                    {holes.map((hole, index) => (
                        <div key={index} className="hole-column">
                            <div className="hole-hcp">{hole.hcp_index || '-'}</div>
                        </div>
                    ))}
                    <div className="hole-column total-column">
                        <div className="hole-hcp">-</div>
                    </div>
                </div>

                {/* Net Score row */}
                <div className="scorecard-row">
                    <div className="row-label">Net</div>
                    {holes.map((hole, index) => {
                        const globalIndex = startIndex + index;
                        return (
                            <div key={index} className="hole-column">
                                <div className="hole-net-score">
                                    {scores[globalIndex] ? getNetScore(scores[globalIndex], globalIndex) : '-'}
                                </div>
                            </div>
                        );
                    })}
                    <div className="hole-column total-column">
                        <div className="hole-net-score">
                            {handicap && scores.slice(startIndex, startIndex + 9).reduce((sum, score, index) => {
                                if (!score) return sum;
                                const globalIndex = startIndex + index;
                                const netScore = getNetScore(score, globalIndex);
                                return netScore !== '-' ? sum + netScore : sum;
                            }, 0) || '-'}
                        </div>
                    </div>
                </div>

                {/* Fairway hit row */}
                <div className="scorecard-row fairway-row">
                    <div className="row-label fairway-label">FWY</div>
                    {sectionFairways.map((hit, index) => {
                        const globalIndex = startIndex + index;
                        return (
                            <div key={index} className="hole-column fairway-column">
                                <div
                                    className={`fairway-toggle ${hit ? 'fairway-hit' : 'fairway-miss'}`}
                                    onClick={() => updateFairwayHit(globalIndex, !hit)}
                                    aria-label={`Fairway hit for hole ${globalIndex + 1}`}
                                    role="checkbox"
                                    aria-checked={hit}
                                    tabIndex="0"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            updateFairwayHit(globalIndex, !hit);
                                        }
                                    }}
                                >
                                    {hit ? '✓' : ''}
                                </div>
                            </div>
                        );
                    })}
                    <div className="hole-column total-column">
                        {sectionTotalFairways}
                    </div>
                </div>

                {/* Putts row */}
                <div className="scorecard-row putt-row">
                    <div className="row-label putt-label">Putts</div>
                    {sectionPutts.map((putts, index) => {
                        const globalIndex = startIndex + index;
                        return (
                            <div key={index} className="hole-column putt-column">
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={putts || ''}
                                    onChange={(e) => updatePuttCount(globalIndex, parseInt(e.target.value) || 0)}
                                    className="putt-input"
                                    aria-label={`Putts for hole ${globalIndex + 1}`}
                                />
                            </div>
                        );
                    })}
                    <div className="hole-column total-column">
                        {sectionTotalPutts}
                    </div>
                </div>

                {/* Bunker row */}
                <div className="scorecard-row bunker-row">
                    <div className="row-label bunker-label">Bunker</div>
                    {sectionBunkers.map((bunkers, index) => {
                        const globalIndex = startIndex + index;
                        return (
                            <div key={index} className="hole-column bunker-column">
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={bunkers || ''}
                                    onChange={(e) => updateBunkerCount(globalIndex, parseInt(e.target.value) || 0)}
                                    className="bunker-input"
                                    aria-label={`Bunkers hit for hole ${globalIndex + 1}`}
                                />
                            </div>
                        );
                    })}
                    <div className="hole-column total-column">
                        {sectionTotalBunkers}
                    </div>
                </div>

                {/* GIR row */}
                <div className="scorecard-row gir-row">
                    <div className="row-label gir-label">GIR</div>
                    {sectionGirs.map((gir, index) => {
                        const globalIndex = startIndex + index;
                        return (
                            <div key={index} className="hole-column gir-column">
                                <div
                                    className={`fairway-toggle ${gir ? 'fairway-hit' : 'fairway-miss'}`}
                                    onClick={() => updateGirCount(globalIndex, !gir)}
                                    aria-label={`Green in Regulation for hole ${globalIndex + 1}`}
                                    role="checkbox"
                                    aria-checked={gir}
                                    tabIndex="0"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            updateGirCount(globalIndex, !gir);
                                        }
                                    }}
                                >
                                    {gir ? '✓' : ''}
                                </div>
                            </div>
                        );
                    })}
                    <div className="hole-column total-column">
                        {sectionTotalGirs}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="scorecard-container">
            {/* Player Info Header */}
            <div className="scorecard-header-banner">
                <div className="player-info">
                    {playerName} • {courseData.name}
                    <strong>{currentHole && ` • Hole ${currentHole.number} (${currentHole.distance}m)`}</strong>
                </div>
            </div>

            {/* Main Scorecard Sections */}
            <div className="scorecard-sections">
                {renderScorecardSection(frontNine, 0, "Front 9")}
                {renderScorecardSection(backNine, 9, "Back 9")}
            </div>

            {/* Overall Total Section */}
            <div className="scorecard-section">
                <div className="scorecard-row">
                    <div className="row-label">Total</div>
                    <div className="hole-column total-column">
                        <div className="hole-score">
                            Par: {courseData.holes.reduce((sum, hole) => sum + hole.par, 0)}
                        </div>
                    </div>
                    <div className="hole-column total-column">
                        <div className="hole-score">
                            Score: {scores.reduce((sum, score) => sum + score, 0) || '-'}
                        </div>
                    </div>

                </div>
            </div>

            {/* Toggle button for details table */}
            <div className="details-toggle" onClick={toggleDetailsTable}>
                {showDetailsTable ? (
                    <>
                        <span>Hide Details</span>
                        <FaChevronUp className="toggle-icon" />
                    </>
                ) : (
                    <>
                        <span>Show Details</span>
                        <FaChevronDown className="toggle-icon" />
                    </>
                )}
            </div>

            {/* Details Sections */}
            {showDetailsTable && (
                <div className="scorecard-sections">
                    {renderDetailsSection(frontNine, 0, "Front 9")}
                    {renderDetailsSection(backNine, 9, "Back 9")}

                    {/* Overall Details Total */}
                    <div className="scorecard-section">
                        <div className="section-header">Overall Totals</div>
                        <div className="scorecard-row">
                            <div className="row-label">Stats</div>
                            <div className="hole-column total-column">
                                <div className="hole-score">
                                    Putts: {totalPutts}
                                </div>
                            </div>
                            <div className="hole-column total-column">
                                <div className="hole-score">
                                    GIR: {totalGirs}
                                </div>
                            </div>
                            <div className="hole-column total-column">
                                <div className="hole-score">
                                    FWY: {totalFairways}
                                </div>
                            </div>
                            <div className="hole-column total-column">
                                <div className="hole-score">
                                    Bunkers: {totalBunkers}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ScoreCard