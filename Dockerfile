# syntax=docker/dockerfile:1

# ---- Multi-stage build for the Next.js (cars-frontend) app ----
# Produces a small production image using Next.js standalone output.

# 1) Install dependencies (cached unless package*.json changes)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2) Build the app
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at BUILD time, so the
# backend URLs must be set here (not at runtime). Override with --build-arg.
# For Docker, "localhost" points at the container itself — point these at your
# backend host instead, e.g. http://host.docker.internal:8081/api/auth on
# Docker Desktop, or a service name like http://cars-backend:8081/api/auth.
ARG NEXT_PUBLIC_API_BASE=http://localhost:8081/api/auth
ARG NEXT_PUBLIC_CARS_API=http://localhost:8081/api/cars
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_CARS_API=$NEXT_PUBLIC_CARS_API
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# 3) Minimal runtime image
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy the standalone server, static assets, and public files.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# The standalone output emits server.js at the app root.
CMD ["node", "server.js"]
