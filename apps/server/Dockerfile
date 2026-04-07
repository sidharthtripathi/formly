FROM node:20-alpine AS base
WORKDIR /app

FROM base AS install
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS build
COPY package.json package-lock.json* ./
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN npm ci
COPY . .
RUN npm run build --filter=@formly/server

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=install /app/node_modules ./node_modules
COPY --from=build /app/apps/server/dist ./dist
COPY --from=build /app/apps/server/package.json ./package.json
COPY --from=build /app/packages ./packages
EXPOSE 3001
CMD ["node", "dist/index.js"]
