package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// createRound creates a new round for the current user
func createRound(c *gin.Context) {
	// Get current user
	user, exists := getCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	// Parse request body
	var roundCreate RoundCreate
	if err := c.ShouldBindJSON(&roundCreate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate scores
	completedHoles := 0
	for _, score := range roundCreate.Scores {
		if score > 0 {
			completedHoles++
		}
	}

	if completedHoles < 9 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Round must have at least 9 completed holes"})
		return
	}

	// Convert arrays to JSON strings
	scoresJSON, err := json.Marshal(roundCreate.Scores)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encode scores"})
		return
	}

	var puttsJSON, girJSON, fairwaysJSON, bunkersJSON []byte
	if roundCreate.Putts != nil {
		puttsJSON, err = json.Marshal(roundCreate.Putts)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encode putts"})
			return
		}
	}

	if roundCreate.GIR != nil {
		girJSON, err = json.Marshal(roundCreate.GIR)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encode GIR"})
			return
		}
	}

	if roundCreate.Fairways != nil {
		fairwaysJSON, err = json.Marshal(roundCreate.Fairways)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encode fairways"})
			return
		}
	}

	if roundCreate.Bunkers != nil {
		bunkersJSON, err = json.Marshal(roundCreate.Bunkers)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encode bunkers"})
			return
		}
	}

	// Insert round into database
	result, err := DB.Exec(
		`INSERT INTO rounds 
		(user_id, course_id, tee_box_id, date, scores, putts, gir, fairways, bunkers) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		user.ID, roundCreate.CourseID, roundCreate.TeeBoxID, roundCreate.Date,
		string(scoresJSON),
		sql.NullString{String: string(puttsJSON), Valid: len(puttsJSON) > 0},
		sql.NullString{String: string(girJSON), Valid: len(girJSON) > 0},
		sql.NullString{String: string(fairwaysJSON), Valid: len(fairwaysJSON) > 0},
		sql.NullString{String: string(bunkersJSON), Valid: len(bunkersJSON) > 0},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save round"})
		return
	}

	roundID, err := result.LastInsertId()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get round ID"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":      roundID,
		"message": "Round saved successfully",
	})
}

// getUserRounds gets all rounds for the current user
func getUserRounds(c *gin.Context) {
	// Get current user
	user, exists := getCurrentUser(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	// Query rounds from database
	rows, err := DB.Query(`
		SELECT r.id, r.course_id, r.tee_box_id, r.date, r.scores,
			   r.putts, r.gir, r.fairways, r.bunkers,
			   c.name as course_name, t.name as tee_name
		FROM rounds r
			 JOIN courses c ON r.course_id = c.id
			 JOIN tee_boxes t ON r.tee_box_id = t.id
		WHERE r.user_id = ?
		ORDER BY r.date DESC
	`, user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query rounds"})
		return
	}
	defer rows.Close()

	var rounds []RoundResponse
	for rows.Next() {
		var (
			id         int
			courseID   int
			teeBoxID   int
			date       string
			courseName string
			teeName    string
			scoresJSON string
			puttsJSON  sql.NullString
			girJSON    sql.NullString
			fairwaysJSON sql.NullString
			bunkersJSON sql.NullString
		)

		if err := rows.Scan(
			&id, &courseID, &teeBoxID, &date, &scoresJSON,
			&puttsJSON, &girJSON, &fairwaysJSON, &bunkersJSON,
			&courseName, &teeName,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan round"})
			return
		}

		// Parse JSON data
		var scores []int
		if err := json.Unmarshal([]byte(scoresJSON), &scores); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse scores"})
			return
		}

		var putts []int
		if puttsJSON.Valid {
			if err := json.Unmarshal([]byte(puttsJSON.String), &putts); err != nil {
				putts = nil
			}
		}

		var gir []bool
		if girJSON.Valid {
			if err := json.Unmarshal([]byte(girJSON.String), &gir); err != nil {
				gir = nil
			}
		}

		var fairways []bool
		if fairwaysJSON.Valid {
			if err := json.Unmarshal([]byte(fairwaysJSON.String), &fairways); err != nil {
				fairways = nil
			}
		}

		var bunkers []int
		if bunkersJSON.Valid {
			if err := json.Unmarshal([]byte(bunkersJSON.String), &bunkers); err != nil {
				bunkers = nil
			}
		}

		// Calculate total score
		totalScore := 0
		for _, score := range scores {
			if score > 0 {
				totalScore += score
			}
		}

		round := RoundResponse{
			ID:         id,
			CourseID:   courseID,
			CourseName: courseName,
			TeeBoxID:   teeBoxID,
			TeeName:    teeName,
			Date:       date,
			Scores:     scores,
			Putts:      putts,
			GIR:        gir,
			Fairways:   fairways,
			Bunkers:    bunkers,
			TotalScore: totalScore,
		}

		rounds = append(rounds, round)
	}

	c.JSON(http.StatusOK, rounds)
}

// seedDatabase seeds the database with sample courses
func seedDatabase(c *gin.Context) {
	// Start a transaction
	tx, err := DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	// Clear existing data
	_, err = tx.Exec("DELETE FROM holes")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear holes"})
		return
	}

	_, err = tx.Exec("DELETE FROM tee_boxes")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear tee boxes"})
		return
	}

	_, err = tx.Exec("DELETE FROM courses")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear courses"})
		return
	}

	// Sample courses
	courses := []struct {
		name        string
		location    string
		description string
	}{
		{"Bro Hof Slott GC", "Stockholm, Sweden", "Championship level course"},
		{"Ullna Golf Club", "Stockholm, Sweden", "Beautiful lakeside course"},
		{"Halmstad GK (North)", "Halmstad, Sweden", "Classic Swedish course"},
		{"Falsterbo GK", "Falsterbo, Sweden", "Stunning coastal links"},
		{"Barsebäck Golf & CC", "Barsebäck, Sweden", "Former European Tour venue"},
	}

	// Insert courses
	for _, course := range courses {
		result, err := tx.Exec(
			"INSERT INTO courses (name, location, description) VALUES (?, ?, ?)",
			course.name, course.location, course.description,
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

		// Create tee boxes for this course
		teeBoxes := []string{"Championship", "Club", "Forward"}
		for teeIdx, teeName := range teeBoxes {
			teeBoxResult, err := tx.Exec(
				"INSERT INTO tee_boxes (course_id, name) VALUES (?, ?)",
				courseID, teeName,
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

			// Create holes for this tee box
			baseDistance := 165 - (teeIdx * 15)
			distanceIncrement := 15 - (teeIdx * 2)

			for holeNumber := 1; holeNumber <= 18; holeNumber++ {
				distance := baseDistance + ((holeNumber - 1) * distanceIncrement)
				par := 4
				if holeNumber%4 == 0 {
					par = 5
				} else if holeNumber%4 == 2 {
					par = 3
				}
				hcpIndex := ((holeNumber * 7) % 18) + 1

				_, err := tx.Exec(
					"INSERT INTO holes (tee_box_id, number, distance, par, hcp_index) VALUES (?, ?, ?, ?, ?)",
					teeBoxID, holeNumber, distance, par, hcpIndex,
				)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert hole"})
					return
				}
			}
		}
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Database seeded successfully"})
}