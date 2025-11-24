FROM node:20-alpine

WORKDIR /app

# Copy package files and config files from root
COPY package*.json ./
COPY vite.config.js ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY tsconfig*.json ./
COPY eslint.config.js ./
COPY index.html ./

# Install dependencies
RUN npm install

# Copy frontend source code
COPY frontend/ ./frontend/

# Expose Vite dev server port
EXPOSE 5173

# Set environment variable for API base URL (can be overridden via docker-compose)
ENV VITE_API_BASE_URL=http://localhost:5000
ENV NODE_ENV=development

# Start Vite dev server with host binding for Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
