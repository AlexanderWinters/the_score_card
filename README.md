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

## Deploying a Development Server

### Build and Deploy with Vite and NGINX

This project uses Vite as its build tool, which provides a fast and optimized build process for development and production deployments.

1. **Build the application**:
   ```bash
   npm run build
   ```
   This command generates optimized static files in the `dist` directory.

2. **Deploy to NGINX**:
   ```bash
   sudo cp -r dist/* /var/www/html/
   ```
   This copies the build files to your NGINX web server's directory.

### Best Practices for Development Deployment

- **Use Environment Variables**: Create `.env` files for different environments (`.env.development`, `.env.production`) to manage environment-specific configurations.

- **Configure CORS and HMR**: The project is already set up with CORS enabled and Hot Module Replacement (HMR) configured in `vite.config.js`:
  ```javascript
  server: {
    host: true,
    cors: true,
    hmr: {
      host: 'developer.kknds.com'
    }
  }
  ```

- **NGINX Configuration**:
  ```nginx
  server {
      listen 80;
      server_name dev.yourdomain.com;
      root /var/www/html;
      
      location / {
          try_files $uri $uri/ /index.html;
      }
      
      # Enable gzip compression
      gzip on;
      gzip_types text/plain text/css application/json application/javascript;
      
      # Set caching headers
      location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
          expires 1d;
          add_header Cache-Control "public, max-age=86400";
      }
  }
  ```

- **Automated Deployment**: Consider setting up a simple deployment script:
  ```bash
  #!/bin/bash
  npm run build
  sudo cp -r dist/* /var/www/html/
  sudo systemctl reload nginx
  echo "Deployment complete!"
  ```

- **Health Checks**: Implement a basic health check endpoint in your application to monitor the deployment status.

- **Version Tagging**: Consider adding version information to your builds for easier debugging.

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