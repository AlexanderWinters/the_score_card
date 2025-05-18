# Dockerfile
FROM node:20-slim AS frontend-build

# Set working directory for frontend
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source files
COPY . .

# Build frontend for production
RUN npm run build

# Setup Python backend
FROM python:3.11-slim

# Install dependencies for both backend and to serve frontend
RUN apt-get update && apt-get install -y \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Set up nginx to serve frontend
COPY --from=frontend-build /app/dist /var/www/html
COPY docker/nginx.conf /etc/nginx/sites-available/default

# Set up backend
WORKDIR /app/server
COPY server/ ./

# Install Python dependencies
# Install Python dependencies
RUN pip install --no-cache-dir fastapi uvicorn sqlalchemy pydantic aiosqlite python-multipart python-jose[cryptography]
# Copy startup script
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Expose ports
EXPOSE 80 3000

# Start both services
CMD ["/start.sh"]