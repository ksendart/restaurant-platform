FROM node:20-alpine AS deps
WORKDIR /workspace
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

FROM node:20-alpine AS builder
WORKDIR /workspace
ENV CI=true
COPY --from=deps /workspace/node_modules ./node_modules
COPY . .
RUN npx nx build web --configuration=production --skip-nx-cache

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /workspace/dist/apps/web ./
USER app
CMD ["node", "server/server.mjs"]
