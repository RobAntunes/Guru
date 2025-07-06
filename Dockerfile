FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    bash

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S guru -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=guru:nodejs /app/dist ./dist
COPY --from=builder --chown=guru:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=guru:nodejs /app/package.json ./package.json

# Create data directory
RUN mkdir -p /data && chown guru:nodejs /data

# Switch to non-root user
USER guru

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "dist/server.js"]