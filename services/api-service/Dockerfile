# Build stage
FROM node:22.12.0-alpine AS build-stage
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps
COPY . .

# Tăng heap lên 2GB để tránh lỗi out of memory
ENV NODE_OPTIONS=--max_old_space_size=2048

RUN npm run build

# Production stage
FROM node:22.12.0-alpine AS production
WORKDIR /app
COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/node_modules ./node_modules
COPY --from=build-stage /app/package.json .
EXPOSE 3000

CMD ["node", "dist/src/main.js"]
