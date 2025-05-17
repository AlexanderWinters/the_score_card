#!/bin/bash
# Start both the backend and nginx in the same container

# Start the backend server
cd /app/server
python3 -m uvicorn server:app --host 0.0.0.0 --port 3000 &

# Start nginx
nginx -g "daemon off;"