FROM node:22-alpine AS builder

# Install build dependencies for tree-sitter and native modules
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-setuptools \
    python3-dev \
    build-base \
    gcc \
    g++ \
    make \
    git \
    rust \
    cargo

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install setuptools via pip to fix distutils issues (break system packages for Docker)
RUN pip3 install --upgrade setuptools --break-system-packages

# Install dependencies (use legacy peer deps to handle tree-sitter conflicts)
RUN npm install --only=production --legacy-peer-deps

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:22-alpine AS production

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