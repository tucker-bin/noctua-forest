# Use Node.js 20 slim image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (for build)
RUN npm ci

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Only keep production dependencies
RUN npm prune --production

# Create logs directory and set permissions
RUN mkdir -p logs && \
    chown -R node:node /app

# Expose port (Cloud Run will set PORT env variable)
EXPOSE 8080

# Use non-root user
USER node

# Start the application
CMD ["node", "dist/index.js"] 