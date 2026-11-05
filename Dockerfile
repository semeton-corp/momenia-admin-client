# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm install -g pnpm && pnpm build

# Stage 3: Serve static build
FROM node:22-alpine AS runner
WORKDIR /app

# serve@14 pins compression@1.8.1 (CVE-2026-87776); bump to 1.8.2 until serve ships a fix
RUN npm install -g serve && \
    npm install --prefix /usr/local/lib/node_modules/serve --no-save --omit=dev compression@1.8.2 && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
