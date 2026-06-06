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
RUN npx nx build api --configuration=production --skip-nx-cache

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache python3 make g++ \
    && addgroup -S app && adduser -S app -G app
COPY --from=builder /workspace/dist/apps/api/package.json ./package.json
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund \
    && apk del python3 make g++
COPY --from=builder /workspace/dist/apps/api ./
USER app
CMD ["node", "main.js"]
