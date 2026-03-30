FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

FROM base AS build
COPY package.json bun.lockb* ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build --filter=@formly/web

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=install /app/node_modules ./node_modules
COPY --from=build /app/apps/web/.next ./.next
COPY --from=build /app/apps/web/public ./public
COPY --from=build /app/apps/web/start.js ./start.js 2>/dev/null || true
EXPOSE 3000
CMD ["next", "start"]
