package main

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var (
	// SecretKey is used for JWT token signing
	SecretKey string
	// TokenExpiration is the duration for which a token is valid
	TokenExpiration = time.Hour * 24 * 7 // 1 week
)

// initAuth initializes authentication settings
func initAuth() {
	// Set JWT secret key based on environment
	SecretKey = os.Getenv("JWT_SECRET_KEY")
	if SecretKey == "" {
		if os.Getenv("ENV") == "production" {
			log.Fatal("JWT_SECRET_KEY environment variable must be set in production")
		} else {
			log.Println("WARNING: Using insecure development key. Never use this in production!")
			SecretKey = "dev_only_insecure_key_for_testing"
		}
	}
}

// hashPassword creates a bcrypt hash of the password
func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// checkPasswordHash compares a bcrypt hashed password with its possible plaintext equivalent
func checkPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// generateToken creates a new JWT token for a user
func generateToken(email string) (string, error) {
	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": email,
		"exp": time.Now().Add(TokenExpiration).Unix(),
	})

	// Sign the token with our secret
	tokenString, err := token.SignedString([]byte(SecretKey))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// validateEmail performs basic email validation
func validateEmail(email string) bool {
	pattern := regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
	return pattern.MatchString(email)
}

// getUserFromToken extracts user information from a JWT token
func getUserFromToken(tokenString string) (*User, error) {
	// Parse the token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(SecretKey), nil
	})

	if err != nil {
		return nil, err
	}

	// Extract claims
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		email, ok := claims["sub"].(string)
		if !ok {
			return nil, errors.New("invalid token claims")
		}

		// Get user from database
		var user User
		err := DB.QueryRow("SELECT id, email FROM users WHERE email = ?", email).Scan(&user.ID, &user.Email)
		if err != nil {
			return nil, err
		}

		return &user, nil
	}

	return nil, errors.New("invalid token")
}

// authMiddleware is a Gin middleware that validates JWT tokens
func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			return
		}

		// Check if the header has the correct format
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
			return
		}

		// Extract the token
		tokenString := parts[1]

		// Get user from token
		user, err := getUserFromToken(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		// Set user in context
		c.Set("user", user)
		c.Next()
	}
}

// getCurrentUser extracts the current user from the Gin context
func getCurrentUser(c *gin.Context) (*User, bool) {
	userValue, exists := c.Get("user")
	if !exists {
		return nil, false
	}

	user, ok := userValue.(*User)
	return user, ok
}

// registerUser handles user registration
func registerUser(c *gin.Context) {
	var userCreate UserCreate
	if err := c.ShouldBindJSON(&userCreate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate email
	email := strings.ToLower(userCreate.Email)
	if !validateEmail(email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email format"})
		return
	}

	// Check if user already exists
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM users WHERE email = ?", email).Scan(&count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email already registered"})
		return
	}

	// Hash password
	passwordHash, err := hashPassword(userCreate.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Insert user into database
	result, err := DB.Exec("INSERT INTO users (email, password_hash) VALUES (?, ?)", email, passwordHash)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Generate token
	token, err := generateToken(email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, Token{
		AccessToken: token,
		TokenType:   "bearer",
	})
}

// loginForAccessToken handles user login
func loginForAccessToken(c *gin.Context) {
	var loginForm struct {
		Username string `form:"username" binding:"required"`
		Password string `form:"password" binding:"required"`
	}

	if err := c.ShouldBind(&loginForm); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate email
	email := strings.ToLower(loginForm.Username)
	if !validateEmail(email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email format"})
		return
	}

	// Get user from database
	var user User
	var passwordHash string
	err := DB.QueryRow("SELECT id, email, password_hash FROM users WHERE email = ?", email).Scan(
		&user.ID, &user.Email, &passwordHash,
	)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Incorrect email or password"})
		return
	}

	// Verify password
	if !checkPasswordHash(loginForm.Password, passwordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Incorrect email or password"})
		return
	}

	// Generate token
	token, err := generateToken(email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, Token{
		AccessToken: token,
		TokenType:   "bearer",
	})
}