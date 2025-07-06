FROM python:3.11-alpine

# Install system dependencies
RUN apk add --no-cache \
    gcc \
    g++ \
    musl-dev \
    make \
    curl

# Install Python dependencies
RUN pip install --no-cache-dir \
    duckdb \
    fastapi \
    uvicorn \
    pydantic

# Create app directory
WORKDIR /app

# Copy DuckDB server script
COPY duckdb-server.py .

# Create data directory
RUN mkdir -p /data

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start server
CMD ["uvicorn", "duckdb-server:app", "--host", "0.0.0.0", "--port", "8080"]