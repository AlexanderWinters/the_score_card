package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
)

func main() {
	// Initialize router
	r := gin.Default()

	// Configure CORS
	if os.Getenv("ENV") == "production" {
		r.Use(cors.New(cors.Config{
			AllowOrigins:     []string{"https://developer.kknds.com"},
			AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
			AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
			AllowCredentials: true,
		}))
	} else {
		r.Use(cors.New(cors.Config{
			AllowAllOrigins:  true,
			AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
			AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
			AllowCredentials: true,
		}))
	}

	// Initialize database
	if err := initializeDatabase(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Initialize authentication
	initAuth()

	// Setup routes
	setupRoutes(r)

	// Determine port
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	// Start server
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func setupRoutes(r *gin.Engine) {
	// API group
	api := r.Group("/api")
	{
		// Public routes
		api.POST("/register", registerUser)
		api.POST("/token", loginForAccessToken)
		api.GET("/courses", getAllCourses)
		api.GET("/courses/:id", getCourseByID)
		api.GET("/check-database", checkDatabase)
		api.POST("/seed", seedDatabase)

		// Protected routes (require authentication)
		protected := api.Group("")
		protected.Use(authMiddleware())
		{
			// Course management routes
			protected.POST("/courses", addCourse)
			protected.PUT("/courses/:id", updateCourse)
			protected.PATCH("/courses/:id/toggle-active", toggleCourseActive)
			protected.POST("/courses/json-upload", uploadJSONCourses)
			protected.POST("/courses/csv-upload", uploadCSVCourses)

			// Round routes
			protected.POST("/rounds", createRound)
			protected.GET("/rounds", getUserRounds)
		}
	}
}
