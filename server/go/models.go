package main

import (
	"time"
)

// Token represents the authentication token response
type Token struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
}

// TokenData represents the data stored in a JWT token
type TokenData struct {
	Email string `json:"email,omitempty"`
}

// User represents a user in the system
type User struct {
	ID          int    `json:"id"`
	Email       string `json:"email"`
	PasswordHash string `json:"-"` // Not exposed in JSON
}

// UserCreate is used for user registration
type UserCreate struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Hole represents a golf course hole
type Hole struct {
	ID        int `json:"id,omitempty"`
	TeeBoxID  int `json:"tee_box_id"`
	Number    int `json:"number" binding:"required"`
	Distance  int `json:"distance" binding:"required"`
	Par       int `json:"par" binding:"required"`
	HcpIndex  int `json:"hcp_index" binding:"required"`
}

// TeeBox represents a tee box on a golf course
type TeeBox struct {
	ID       int    `json:"id,omitempty"`
	CourseID int    `json:"course_id"`
	Name     string `json:"name" binding:"required"`
	Holes    []Hole `json:"holes,omitempty"`
}

// Course represents a golf course
type Course struct {
	ID          int      `json:"id,omitempty"`
	Name        string   `json:"name" binding:"required"`
	Location    string   `json:"location,omitempty"`
	Description string   `json:"description,omitempty"`
	Active      bool     `json:"active,omitempty"`
	TeeBoxes    []TeeBox `json:"teeBoxes,omitempty"`
}

// HoleCreate is used for creating a new hole
type HoleCreate struct {
	Number   int `json:"number" binding:"required"`
	Distance int `json:"distance" binding:"required"`
	Par      int `json:"par" binding:"required"`
	HcpIndex int `json:"hcp_index" binding:"required"`
}

// TeeBoxCreate is used for creating a new tee box
type TeeBoxCreate struct {
	Name  string       `json:"name" binding:"required"`
	Holes []HoleCreate `json:"holes" binding:"required"`
}

// CourseCreate is used for creating a new course
type CourseCreate struct {
	Name        string         `json:"name" binding:"required"`
	Location    string         `json:"location,omitempty"`
	Description string         `json:"description,omitempty"`
	TeeBoxes    []TeeBoxCreate `json:"teeBoxes" binding:"required"`
}

// Round represents a golf round
type Round struct {
	ID        int       `json:"id,omitempty"`
	UserID    int       `json:"user_id"`
	CourseID  int       `json:"course_id" binding:"required"`
	TeeBoxID  int       `json:"tee_box_id" binding:"required"`
	Date      string    `json:"date" binding:"required"`
	Scores    []int     `json:"scores" binding:"required"`
	Putts     []int     `json:"putts,omitempty"`
	GIR       []bool    `json:"gir,omitempty"`
	Fairways  []bool    `json:"fairways,omitempty"`
	Bunkers   []int     `json:"bunkers,omitempty"`
	CreatedAt time.Time `json:"created_at,omitempty"`
}

// RoundCreate is used for creating a new round
type RoundCreate struct {
	CourseID int    `json:"course_id" binding:"required"`
	TeeBoxID int    `json:"tee_box_id" binding:"required"`
	Date     string `json:"date" binding:"required"`
	Scores   []int  `json:"scores" binding:"required"`
	Putts    []int  `json:"putts,omitempty"`
	GIR      []bool `json:"gir,omitempty"`
	Fairways []bool `json:"fairways,omitempty"`
	Bunkers  []int  `json:"bunkers,omitempty"`
}

// RoundResponse is the response for a round with additional data
type RoundResponse struct {
	ID         int    `json:"id"`
	CourseID   int    `json:"course_id"`
	CourseName string `json:"course_name"`
	TeeBoxID   int    `json:"tee_box_id"`
	TeeName    string `json:"tee_name"`
	Date       string `json:"date"`
	Scores     []int  `json:"scores"`
	Putts      []int  `json:"putts,omitempty"`
	GIR        []bool `json:"gir,omitempty"`
	Fairways   []bool `json:"fairways,omitempty"`
	Bunkers    []int  `json:"bunkers,omitempty"`
	TotalScore int    `json:"total_score"`
}