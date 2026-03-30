FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lockb* ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1 AS web
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/packages ./packages
ENV NODE_ENV=production
EXPOSE 3000
CMD ["next", "start"]

FROM oven/bun:1 AS api
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/packages ./packages
ENV NODE_ENV=production
EXPOSE 3001
CMD ["bun", "run", "dist/index.js"]
