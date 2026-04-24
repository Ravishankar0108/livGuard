# ─────────────────────────────────────────
#  FamTrack — Dockerfile (Backend)
# ─────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S famtrack -u 1001
USER famtrack

EXPOSE 5000
ENV NODE_ENV=production

CMD ["node", "server.js"]
