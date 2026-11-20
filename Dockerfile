FROM node:22-alpine

ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false
WORKDIR /app

# najpierw same zależności - ta warstwa jest z cache, dopóki package*.json się nie zmieni
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY knexfile.js ./
COPY migrations ./migrations
COPY seeds ./seeds
COPY src ./src

USER node
EXPOSE 3000

# exec podmienia powłokę na proces node (PID 1), więc SIGTERM z `docker compose down` trafia do aplikacji
CMD ["sh", "-c", "npx knex migrate:latest && exec node src/server.js"]
