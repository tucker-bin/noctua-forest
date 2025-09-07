FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ vips-dev

WORKDIR /app
COPY package.json package-lock.json* ./

# Install all dependencies for build
RUN npm ci

# Copy source files
COPY . .

# Run full build process
RUN npm run build:all

# Production stage
FROM node:20-alpine

# Install runtime dependencies
RUN apk add --no-cache vips-dev wget

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

ENV PORT=8080
EXPOSE 8080

# Add health check with more retries and longer timeout
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=3 --spider http://localhost:8080/healthz || exit 1

# Start server
CMD ["node", "server/server.js"]
