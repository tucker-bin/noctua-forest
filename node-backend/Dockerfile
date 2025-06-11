# Use Node.js 20 slim image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port (Cloud Run will set PORT env variable)
EXPOSE 8080

# Use non-root user
USER node

# Start the application
CMD ["node", "index.js"] 