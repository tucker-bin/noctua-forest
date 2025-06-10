# Stage 1: Build React frontend
FROM node:18-slim as build-react

WORKDIR /usr/src/app/frontend

# Copy package.json and package-lock.json (or yarn.lock)
# Ensure these paths are correct relative to the Dockerfile's context root
COPY my-rhyme-app/package.json my-rhyme-app/package-lock.json ./

# Install frontend dependencies
# Using --force for peer deps issues common in some setups, or use --legacy-peer-deps
RUN npm install --force 

# Copy the rest of the frontend source code
COPY my-rhyme-app ./ 

# Build the frontend
RUN npm run build

# Stage 2: Python application
FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED True
ENV APP_HOME /app
WORKDIR $APP_HOME

# Install system dependencies that might be needed by some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends gcc libc-dev && rm -rf /var/lib/apt/lists/*

# Create log directory
RUN mkdir -p /var/log/app

# Copy backend requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Python application
COPY app.py .

# Copy the built frontend static files from the build-react stage
# This places the React build output into /app/static, which Flask will serve
COPY --from=build-react /usr/src/app/frontend/dist $APP_HOME/static

# Create volume for logs
VOLUME ["/var/log/app"]

# Run the web service on container startup with improved configuration
CMD exec gunicorn \
    --bind :$PORT \
    --workers 4 \
    --threads 8 \
    --timeout 120 \
    --worker-class gthread \
    --log-level info \
    app:app
