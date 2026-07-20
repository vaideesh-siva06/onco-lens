# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_PYTHON_API_URL=http://localhost:8001
ENV VITE_PYTHON_API_URL=$VITE_PYTHON_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:1.25.2-alpine-slim

# Copy build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
