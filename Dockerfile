FROM node:20-alpine

# Install build dependencies for Sharp
RUN apk add --no-cache python3 make g++ vips-dev

WORKDIR /app
COPY package.json package-lock.json* ./

# Install dependencies with Sharp support
RUN npm ci --only=production || npm i --omit=dev

COPY . .

# Generate images (with proper error handling)
RUN node scripts/generate-images.mjs || echo "Image generation skipped"

ENV PORT=8080
EXPOSE 8080

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/healthz || exit 1

CMD ["node", "server/server.js"]