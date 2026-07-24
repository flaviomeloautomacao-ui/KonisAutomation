# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/automacao

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_APP_URL=
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
ARG NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/automacao
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ENV NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=$NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/lib/generated ./lib/generated
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/lib/generated ./lib/generated
# Seed de admin (idempotente) rodado no start — usa apenas pg + bcryptjs (prod deps).
COPY --from=builder /app/scripts/seed-admin.mjs ./scripts/seed-admin.mjs

EXPOSE 3000

# Roda o seed de admin e, em seguida, sobe o servidor. O seed é no-op quando não
# configurado e nunca derruba o start (sempre sai com 0). `exec` faz o next start
# assumir o PID para receber os sinais de shutdown.
CMD ["sh", "-c", "node scripts/seed-admin.mjs; exec npm run start"]
