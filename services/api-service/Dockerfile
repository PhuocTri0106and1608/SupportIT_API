# Build stage
FROM node:22.12.0-alpine AS build-stage
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps
COPY . .

RUN npm run build

# Production stage
FROM node:22.12.0-alpine AS production
WORKDIR /app
COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/node_modules ./node_modules
COPY --from=build-stage /app/package.json .
EXPOSE 8080

CMD ["node", "dist/src/main.js"]
