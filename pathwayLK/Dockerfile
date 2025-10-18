# Multi-stage Dockerfile for PathwayLK API
FROM golang:1.23-alpine AS builder

WORKDIR /build

# Enable Go toolchain auto-download
ENV GOTOOLCHAIN=auto

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app ./cmd/server

# Final stage - minimal image
FROM alpine:latest

# Add ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app ./

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["./app"]
