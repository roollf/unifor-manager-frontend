# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install dependencies (including devDependencies for the build)
RUN npm ci

# Copy source
COPY . .

# Inject API and Keycloak URLs at build time (defaults: local backend + Keycloak on host)
ARG API_URL=http://localhost:8080
ARG KEYCLOAK_URL=http://localhost:8081
RUN echo "export const environment = { production: true, apiUrl: '${API_URL}', keycloak: { url: '${KEYCLOAK_URL}', realm: 'unifor', clientId: 'unifor-manager' } } as const;" > src/environments/environment.prod.ts

# Build for production (output in dist/unifor-manager-frontend/browser)
RUN npm run build

# Serve stage
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from build stage
COPY --from=build /app/dist/unifor-manager-frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
