# API Aqu.app — image de production
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --workspace server --include-workspace-root
COPY server server
RUN npm run build -w server

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/server/package.json server/
COPY --from=build /app/client/package.json client/
RUN npm ci --workspace server --include-workspace-root --omit=dev
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/server/src/generated server/src/generated
COPY server/prisma server/prisma
COPY server/prisma.config.ts server/
COPY server/samples server/samples
WORKDIR /app/server
EXPOSE 4000
# Applique les migrations puis démarre l'API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/index.js"]
