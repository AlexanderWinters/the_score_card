package main

import (
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// getAllCourses returns all courses in the database
func getAllCourses(c *gin.Context) {
	includeInactive := c.Query("include_inactive") == "true"

	var rows *sql.Rows
	var err error

	if includeInactive {
		rows, err = DB.Query("SELECT id, name, location, description, active FROM courses")
	} else {
		rows, err = DB.Query("SELECT id, name, location, description, active FROM courses WHERE active = 1")
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query courses"})
		return
	}
	defer rows.Close()

	var courses []Course
	for rows.Next() {
		var course Course
		if err := rows.Scan(&course.ID, &course.Name, &course.Location, &course.Description, &course.Active); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan course"})
			return
		}
		courses = append(courses, course)
	}

	c.JSON(http.StatusOK, courses)
}

// getCourseByID returns a specific course by ID
func getCourseByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	course, err := GetCourseByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get course"})
		}
		return
	}

	c.JSON(http.StatusOK, course)
}

// addCourse adds a new course to the database
func addCourse(c *gin.Context) {
	var courseCreate CourseCreate
	if err := c.ShouldBindJSON(&courseCreate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Start a transaction
	tx, err := DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	// Insert course
	result, err := tx.Exec(
		"INSERT INTO courses (name, location, description) VALUES (?, ?, ?)",
		courseCreate.Name, courseCreate.Location, courseCreate.Description,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert course"})
		return
	}

	courseID, err := result.LastInsertId()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get course ID"})
		return
	}

	// Insert tee boxes and holes
	for _, teeBox := range courseCreate.TeeBoxes {
		teeBoxResult, err := tx.Exec(
			"INSERT INTO tee_boxes (course_id, name) VALUES (?, ?)",
			courseID, teeBox.Name,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert tee box"})
			return
		}

		teeBoxID, err := teeBoxResult.LastInsertId()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get tee box ID"})
			return
		}

		for _, hole := range teeBox.Holes {
			_, err := tx.Exec(
				"INSERT INTO holes (tee_box_id, number, distance, par, hcp_index) VALUES (?, ?, ?, ?, ?)",
				teeBoxID, hole.Number, hole.Distance, hole.Par, hole.HcpIndex,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert hole"})
				return
			}
		}
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Get the newly created course
	course, err := GetCourseByID(int(courseID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get created course"})
		return
	}

	c.JSON(http.StatusCreated, course)
}

// updateCourse updates an existing course
func updateCourse(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	var courseUpdate CourseCreate
	if err := c.ShouldBindJSON(&courseUpdate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if course exists
	var exists bool
	err = DB.QueryRow("SELECT EXISTS(SELECT 1 FROM courses WHERE id = ?)", id).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	// Start a transaction
	tx, err := DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	// Update course
	_, err = tx.Exec(
		"UPDATE courses SET name = ?, location = ?, description = ? WHERE id = ?",
		courseUpdate.Name, courseUpdate.Location, courseUpdate.Description, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update course"})
		return
	}

	// Delete existing tee boxes and holes
	teeBoxRows, err := tx.Query("SELECT id FROM tee_boxes WHERE course_id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query tee boxes"})
		return
	}
	defer teeBoxRows.Close()

	for teeBoxRows.Next() {
		var teeBoxID int
		if err := teeBoxRows.Scan(&teeBoxID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan tee box ID"})
			return
		}

		_, err = tx.Exec("DELETE FROM holes WHERE tee_box_id = ?", teeBoxID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete holes"})
			return
		}
	}

	_, err = tx.Exec("DELETE FROM tee_boxes WHERE course_id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete tee boxes"})
		return
	}

	// Insert new tee boxes and holes
	for _, teeBox := range courseUpdate.TeeBoxes {
		teeBoxResult, err := tx.Exec(
			"INSERT INTO tee_boxes (course_id, name) VALUES (?, ?)",
			id, teeBox.Name,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert tee box"})
			return
		}

		teeBoxID, err := teeBoxResult.LastInsertId()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get tee box ID"})
			return
		}

		for _, hole := range teeBox.Holes {
			_, err := tx.Exec(
				"INSERT INTO holes (tee_box_id, number, distance, par, hcp_index) VALUES (?, ?, ?, ?, ?)",
				teeBoxID, hole.Number, hole.Distance, hole.Par, hole.HcpIndex,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert hole"})
				return
			}
		}
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Get the updated course
	course, err := GetCourseByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get updated course"})
		return
	}

	c.JSON(http.StatusOK, course)
}

// toggleCourseActive toggles the active status of a course
func toggleCourseActive(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	// Check if course exists and get current active status
	var active bool
	err = DB.QueryRow("SELECT active FROM courses WHERE id = ?", id).Scan(&active)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	// Toggle active status
	newActive := !active
	_, err = DB.Exec("UPDATE courses SET active = ? WHERE id = ?", newActive, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update course"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": id, "active": newActive})
}

// checkDatabase checks if the database has any courses
func checkDatabase(c *gin.Context) {
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM courses").Scan(&count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"initialized": true,
		"has_courses": count > 0,
	})
}

// uploadJSONCourses handles uploading courses from a JSON file
func uploadJSONCourses(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// Read file contents
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}

	// Parse JSON
	var coursesData []CourseCreate
	err = json.Unmarshal(fileBytes, &coursesData)
	if err != nil {
		// Try as single course
		var singleCourse CourseCreate
		err = json.Unmarshal(fileBytes, &singleCourse)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format"})
			return
		}
		coursesData = []CourseCreate{singleCourse}
	}

	// Start a transaction
	tx, err := DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	addedCourseIDs := []int{}

	// Process each course
	for _, courseData := range coursesData {
		// Validate course data
		if courseData.Name == "" || len(courseData.TeeBoxes) == 0 {
			continue
		}

		// Insert course
		result, err := tx.Exec(
			"INSERT INTO courses (name, location, description) VALUES (?, ?, ?)",
			courseData.Name, courseData.Location, courseData.Description,
		)
		if err != nil {
			continue
		}

		courseID, err := result.LastInsertId()
		if err != nil {
			continue
		}

		addedCourseIDs = append(addedCourseIDs, int(courseID))

		// Insert tee boxes and holes
		for _, teeBox := range courseData.TeeBoxes {
			if teeBox.Name == "" || len(teeBox.Holes) == 0 {
				continue
			}

			teeBoxResult, err := tx.Exec(
				"INSERT INTO tee_boxes (course_id, name) VALUES (?, ?)",
				courseID, teeBox.Name,
			)
			if err != nil {
				continue
			}

			teeBoxID, err := teeBoxResult.LastInsertId()
			if err != nil {
				continue
			}

			for _, hole := range teeBox.Holes {
				if hole.Number < 1 || hole.Distance < 1 || hole.Par < 1 || hole.HcpIndex < 1 {
					continue
				}

				_, err := tx.Exec(
					"INSERT INTO holes (tee_box_id, number, distance, par, hcp_index) VALUES (?, ?, ?, ?, ?)",
					teeBoxID, hole.Number, hole.Distance, hole.Par, hole.HcpIndex,
				)
				if err != nil {
					continue
				}
			}
		}
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Successfully added " + strconv.Itoa(len(addedCourseIDs)) + " courses",
		"course_ids": addedCourseIDs,
	})
}

// uploadCSVCourses handles uploading courses from a CSV file
func uploadCSVCourses(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// Parse CSV
	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid CSV format"})
		return
	}

	if len(records) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "CSV file must have a header row and at least one data row"})
		return
	}

	// Process CSV data
	header := records[0]
	data := records[1:]

	// Map column indices
	colMap := make(map[string]int)
	for i, col := range header {
		colMap[col] = i
	}

	// Check required columns
	requiredCols := []string{"course_name", "tee_name", "hole_number", "distance", "par", "hcp_index"}
	for _, col := range requiredCols {
		if _, ok := colMap[col]; !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required column: " + col})
			return
		}
	}

	// Process data into courses
	coursesMap := make(map[string]map[string][]HoleCreate)

	for _, row := range data {
		if len(row) < len(header) {
			continue
		}

		courseName := row[colMap["course_name"]]
		teeName := row[colMap["tee_name"]]

		if courseName == "" || teeName == "" {
			continue
		}

		holeNumber, err := strconv.Atoi(row[colMap["hole_number"]])
		if err != nil || holeNumber < 1 {
			continue
		}

		distance, err := strconv.Atoi(row[colMap["distance"]])
		if err != nil || distance < 1 {
			continue
		}

		par, err := strconv.Atoi(row[colMap["par"]])
		if err != nil || par < 1 {
			continue
		}

		hcpIndex, err := strconv.Atoi(row[colMap["hcp_index"]])
		if err != nil || hcpIndex < 1 {
			continue
		}

		// Create course if it doesn't exist
		if _, ok := coursesMap[courseName]; !ok {
			coursesMap[courseName] = make(map[string][]HoleCreate)
		}

		// Create tee box if it doesn't exist
		if _, ok := coursesMap[courseName][teeName]; !ok {
			coursesMap[courseName][teeName] = []HoleCreate{}
		}

		// Add hole
		hole := HoleCreate{
			Number:   holeNumber,
			Distance: distance,
			Par:      par,
			HcpIndex: hcpIndex,
		}

		coursesMap[courseName][teeName] = append(coursesMap[courseName][teeName], hole)
	}

	// Convert to CourseCreate objects
	var courses []CourseCreate
	for courseName, teeBoxes := range coursesMap {
		var location, description string
		if locIdx, ok := colMap["location"]; ok && len(data) > 0 {
			location = data[0][locIdx]
		}
		if descIdx, ok := colMap["description"]; ok && len(data) > 0 {
			description = data[0][descIdx]
		}

		course := CourseCreate{
			Name:        courseName,
			Location:    location,
			Description: description,
			TeeBoxes:    []TeeBoxCreate{},
		}

		for teeName, holes := range teeBoxes {
			if len(holes) == 0 {
				continue
			}

			teeBox := TeeBoxCreate{
				Name:  teeName,
				Holes: holes,
			}

			course.TeeBoxes = append(course.TeeBoxes, teeBox)
		}

		if len(course.TeeBoxes) > 0 {
			courses = append(courses, course)
		}
	}

	// Start a transaction
	tx, err := DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	addedCourseIDs := []int{}

	// Insert courses
	for _, course := range courses {
		// Insert course
		result, err := tx.Exec(
			"INSERT INTO courses (name, location, description) VALUES (?, ?, ?)",
			course.Name, course.Location, course.Description,
		)
		if err != nil {
			continue
		}

		courseID, err := result.LastInsertId()
		if err != nil {
			continue
		}

		addedCourseIDs = append(addedCourseIDs, int(courseID))

		// Insert tee boxes and holes
		for _, teeBox := range course.TeeBoxes {
			teeBoxResult, err := tx.Exec(
				"INSERT INTO tee_boxes (course_id, name) VALUES (?, ?)",
				courseID, teeBox.Name,
			)
			if err != nil {
				continue
			}

			teeBoxID, err := teeBoxResult.LastInsertId()
			if err != nil {
				continue
			}

			for _, hole := range teeBox.Holes {
				_, err := tx.Exec(
					"INSERT INTO holes (tee_box_id, number, distance, par, hcp_index) VALUES (?, ?, ?, ?, ?)",
					teeBoxID, hole.Number, hole.Distance, hole.Par, hole.HcpIndex,
				)
				if err != nil {
					continue
				}
			}
		}
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Successfully added " + strconv.Itoa(len(addedCourseIDs)) + " courses",
		"course_ids": addedCourseIDs,
	})
}