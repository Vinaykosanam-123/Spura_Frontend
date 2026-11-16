# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG NEXT_PUBLIC_API_URL=https://spura-backend.onrender.com
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_DEV_BYPASS=false

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=https://spura-backend.onrender.com
ENV NEXT_PUBLIC_DEV_BYPASS=false

# Install G++ (C++20) and OpenJDK 21 so /api/compile works in /coding
RUN apk add --no-cache g++ musl-dev openjdk21-jdk

RUN addgroup -S spura && adduser -S spura -G spura

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

USER spura
EXPOSE 4028

CMD ["sh", "-c", "npx next start -p ${PORT:-4028}"]
