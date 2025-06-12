package main

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

var (
	// DB is the global database connection
	DB *sql.DB
	// DBPath is the path to the SQLite database file
	DBPath string
)

// initializeDatabase sets up the database connection and creates tables if they don't exist
func initializeDatabase() error {
	// Set database path based on environment
	if os.Getenv("ENV") == "production" {
		DBPath = os.Getenv("DATABASE_PATH")
		if DBPath == "" {
			DBPath = "golf.db"
		}
	} else {
		DBPath = "golf.db"
	}

	// Open database connection
	var err error
	DB, err = sql.Open("sqlite3", DBPath)
	if err != nil {
		return err
	}

	// Test connection
	if err = DB.Ping(); err != nil {
		return err
	}

	// Create tables
	if err = createTables(); err != nil {
		return err
	}

	log.Println("Database initialized successfully")
	return nil
}

// createTables creates all necessary tables if they don't exist
func createTables() error {
	// Create courses table
	_, err := DB.Exec(`
	CREATE TABLE IF NOT EXISTS courses (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		location TEXT,
		description TEXT,
		active BOOLEAN NOT NULL DEFAULT 1
	)
	`)
	if err != nil {
		return err
	}

	// Create tee_boxes table
	_, err = DB.Exec(`
	CREATE TABLE IF NOT EXISTS tee_boxes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		course_id INTEGER NOT NULL,
		name TEXT NOT NULL,
		FOREIGN KEY (course_id) REFERENCES courses (id)
	)
	`)
	if err != nil {
		return err
	}

	// Create holes table
	_, err = DB.Exec(`
	CREATE TABLE IF NOT EXISTS holes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		tee_box_id INTEGER NOT NULL,
		number INTEGER NOT NULL,
		distance INTEGER NOT NULL,
		par INTEGER NOT NULL,
		hcp_index INTEGER NOT NULL,
		FOREIGN KEY (tee_box_id) REFERENCES tee_boxes (id)
	)
	`)
	if err != nil {
		return err
	}

	// Create users table
	_, err = DB.Exec(`
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)
	`)
	if err != nil {
		return err
	}

	// Create rounds table
	_, err = DB.Exec(`
	CREATE TABLE IF NOT EXISTS rounds (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		course_id INTEGER NOT NULL,
		tee_box_id INTEGER NOT NULL,
		date TEXT NOT NULL,
		scores TEXT NOT NULL,
		putts TEXT,
		gir TEXT,
		fairways TEXT,
		bunkers TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users (id),
		FOREIGN KEY (course_id) REFERENCES courses (id),
		FOREIGN KEY (tee_box_id) REFERENCES tee_boxes (id)
	)
	`)
	if err != nil {
		return err
	}

	return nil
}

// GetCourseByID retrieves a course by its ID with all tee boxes and holes
func GetCourseByID(id int) (*Course, error) {
	// Get course details
	var course Course
	err := DB.QueryRow(`SELECT id, name, location, description, active FROM courses WHERE id = ?`, id).Scan(
		&course.ID, &course.Name, &course.Location, &course.Description, &course.Active,
	)
	if err != nil {
		return nil, err
	}

	// Get tee boxes for this course
	rows, err := DB.Query(`SELECT id, course_id, name FROM tee_boxes WHERE course_id = ?`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	course.TeeBoxes = []TeeBox{}
	for rows.Next() {
		var teeBox TeeBox
		if err := rows.Scan(&teeBox.ID, &teeBox.CourseID, &teeBox.Name); err != nil {
			return nil, err
		}

		// Get holes for this tee box
		holeRows, err := DB.Query(`
			SELECT id, tee_box_id, number, distance, par, hcp_index 
			FROM holes 
			WHERE tee_box_id = ? 
			ORDER BY number
		`, teeBox.ID)
		if err != nil {
			return nil, err
		}
		defer holeRows.Close()

		teeBox.Holes = []Hole{}
		for holeRows.Next() {
			var hole Hole
			if err := holeRows.Scan(&hole.ID, &hole.TeeBoxID, &hole.Number, &hole.Distance, &hole.Par, &hole.HcpIndex); err != nil {
				return nil, err
			}
			teeBox.Holes = append(teeBox.Holes, hole)
		}

		course.TeeBoxes = append(course.TeeBoxes, teeBox)
	}

	return &course, nil
}