FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS install
RUN bun install --frozen-lockfile

FROM base AS build
COPY package.json bun.lockb ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=install /app/node_modules ./node_modules
COPY --from=build /app/apps/web/.next ./.next
COPY --from=build /app/apps/web/public ./public
EXPOSE 3000
CMD ["bun", "run", "apps/web/start.js"]
