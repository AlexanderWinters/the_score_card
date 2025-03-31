# Golf Scorecard App

A lightweight, modern golf scorecard application that allows golfers to track their scores, apply handicaps, and view their performance. Built with React and Vite.

![Golf Scorecard App](./screenshot.png)

## Features

- **Score Tracking**: Record scores for each hole
- **Handicap Adjustment**: Automatically adjust scores based on player handicap
- **Course Details**: Display hole distances, par values, and handicap-adjusted par
- **Player Management**: Track scores for individual players
- **Performance Summary**: View total score, comparison to par, and net scores

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/golf-scorecard.git
   cd golf-scorecard
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server:
   ```bash
   vite
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Enter Player Information**:
    - Input your name
    - Set your golf handicap

2. **Select Golf Course**:
    - Enter the course name
    - (Course details are currently using placeholder data)

3. **Record Your Scores**:
    - Enter your score for each hole
    - View the par and distance for each hole

4. **Review Summary**:
    - See your total gross score
    - Compare your score to the course par
    - View your handicap-adjusted net score

## Upcoming Features

- Course selection from a database of real golf courses
- Multiple player support for group play
- Score history tracking over time
- Statistics and performance analysis
- Mobile-optimized responsive design
- Data persistence with local storage and cloud sync

## Technical Details

This application is built using:

- React 19
- Vite 6
- CSS custom properties for theming
- Responsive design for desktop and mobile use

## License

This project is licensed under the GNU GENERAL PUBLIC License - see the LICENSE file for details.

## Acknowledgements

- Golf course data will be provided by [future API integration]
- Design inspiration from professional golf scorecards