# Golf Score Card API - Go Implementation

This is a Go implementation of the Golf Score Card API using the Gin framework. It provides the same functionality as the original Python FastAPI implementation.

## Features

- User authentication with JWT tokens
- Course management (add, update, list courses)
- Round tracking (record and view golf rounds)
- Database seeding and data import (JSON and CSV)
- SQLite database for data storage

## Requirements

- Go 1.21 or higher
- SQLite3

## Getting Started

### Running Locally

1. Clone the repository
2. Navigate to the server/go directory
3. Install dependencies:
   ```
   go mod download
   ```
4. Build and run the server:
   ```
   go run *.go
   ```
5. The server will be available at http://localhost:3000

### Environment Variables

- `PORT`: The port to run the server on (default: 3000)
- `ENV`: Set to "production" for production mode
- `DATABASE_PATH`: Path to the SQLite database file (default: "golf.db")
- `JWT_SECRET_KEY`: Secret key for JWT token signing (required in production)

### Docker

You can also run the server using Docker:

1. Build the Docker image:
   ```
   docker build -t golf-api .
   ```
2. Run the container:
   ```
   docker run -p 3000:3000 -e JWT_SECRET_KEY=your_secret_key golf-api
   ```

## API Endpoints

### Authentication

- `POST /api/register`: Register a new user
- `POST /api/token`: Login and get an access token

### Courses

- `GET /api/courses`: Get all courses
- `GET /api/courses/:id`: Get a specific course
- `POST /api/courses`: Add a new course (protected)
- `PUT /api/courses/:id`: Update a course (protected)
- `PATCH /api/courses/:id/toggle-active`: Toggle a course's active status (protected)
- `POST /api/courses/json-upload`: Upload courses from a JSON file (protected)
- `POST /api/courses/csv-upload`: Upload courses from a CSV file (protected)

### Rounds

- `POST /api/rounds`: Create a new round (protected)
- `GET /api/rounds`: Get all rounds for the current user (protected)

### Database

- `GET /api/check-database`: Check if the database has any courses
- `POST /api/seed`: Seed the database with sample courses

## Authentication

The API uses JWT tokens for authentication. To access protected endpoints, include the token in the Authorization header:

```
Authorization: Bearer your_token_here
```

## Development

### Project Structure

- `main.go`: Entry point and route setup
- `models.go`: Data models
- `database.go`: Database connection and initialization
- `auth.go`: Authentication and token handling
- `courses.go`: Course management endpoints
- `rounds.go`: Round management endpoints

### Building for Production

For production deployment, build the binary:

```
CGO_ENABLED=1 go build -o golf-api .
```

Then run it with the appropriate environment variables:

```
ENV=production JWT_SECRET_KEY=your_secret_key ./golf-api
```