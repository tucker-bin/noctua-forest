FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm i --omit=dev
COPY . .

ENV PORT=8080
EXPOSE 8080
CMD ["node", "server/server.js"]

