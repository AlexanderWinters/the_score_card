# Build stage
FROM golang:1.21-alpine AS builder

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod ./

# Download dependencies
RUN go mod download

# Copy source code
COPY *.go ./

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -a -o golf-api .

# Final stage
FROM alpine:latest

# Install required dependencies for SQLite
RUN apk --no-cache add ca-certificates libc6-compat

# Set working directory
WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/golf-api .

# Copy the database if it exists
COPY golf.db* ./

# Expose port
EXPOSE 3000

# Run the application
CMD ["./golf-api"]