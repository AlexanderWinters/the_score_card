# ⛳️ Golf Scorecard App

A lightweight, modern golf scorecard application that allows golfers to track their scores, apply handicaps, and view their performance. Built with React and Vite.

>[!WARNING]
> Currently under development! 🚧

## ✨ What Can It Do?

- 🏌️ Track your scores hole by hole
- 🧮 Automatically apply your handicap
- 📏 See hole distances and par values
- 📊 View your performance summary
- 💾 Everything saves between sessions - no lost data!


## 🚀 Quick Start

### You'll need:

- Node.js (v16 or higher)
- npm or yarn
- python3

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/golf-scorecard.git
   cd golf-scorecard
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   # or
   yarn
   ```
3. Install backend dependencies:
   ```bash
   cd server
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements
   ```

3. Start the dev server:
   ```bash
   python3 server/server.py #Make sure the venv is active!
   vite
   ```

4. Open your browser and navigate to `http://localhost:5173`

## 🎮 How To Use
1. **Set up your profile:**
   - Enter your name
   - Add your handicap

2. **Pick your course:**
   - Select from available golf courses
   - Choose your preferred tee box

3. **Record as you play:**
   - Enter scores for each hole
   - Track putts and greens in regulation (GIR)
   - See hole details while you play

4. **Check your results:**
   - View your total score
   - Compare to par
   - See your handicap-adjusted score



## 🐳 Deployment

The app is deployed using docker; make sure you have the `docker engine` and `docker compose` installed.

1. **Build and run with docker compose**:
```bash
docker compose up -d
```

Make sure the server is running:
```bash
docker compose logs
```


2. **Access the application**:

Open your browser and navigate to `http://localhost:5100`.

>[!NOTE]
>We will soon deploy a public docker image so you don't need to manually build everytime. 📦

## 🔮 Upcoming Features

- [x] Real golf course database
- [ ] Multiple player scorecards
- [ ] Score history and statistics
- [ ] Mobile-friendly design
- [ ] Cloud sync between devices

## 🔧 Tech Stack

Built with:

- React 19
- Vite 6
- FastAPI
- Sqlite
- Docker 

## 📄 License

This project is licensed under the GNU GENERAL PUBLIC License - see the LICENSE file for details.

## 💖 Thanks To

- Golf course data will be provided by [future API integration]
- Design inspiration from professional golf scorecards
- Adam for testing ♥️