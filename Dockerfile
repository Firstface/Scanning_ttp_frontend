# Builder stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files first for better cache
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config for SPA (handle client-side routing)
COPY --from=builder /app/index.html /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# Default command
CMD ["nginx", "-g", "daemon off;"]
