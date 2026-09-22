# Ein Abbild, zwei Stufen. Die erste holt die Abhaengigkeiten, die zweite
# nimmt nur mit, was im Betrieb gebraucht wird.
FROM node:24-alpine AS abhaengigkeiten
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

# Nicht als root laufen. Das Abbild bringt den Nutzer 'node' schon mit.
COPY --from=abhaengigkeiten --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node server.js ./
COPY --chown=node:node src ./src
COPY --chown=node:node admin ./admin
COPY --chown=node:node assets ./assets
COPY --chown=node:node config ./config
COPY --chown=node:node migrations ./migrations
COPY --chown=node:node page-types ./page-types
COPY --chown=node:node scripts ./scripts

# Uploads liegen hier. Muss ein dauerhaftes Volume sein — sonst sind alle
# Bilder nach dem naechsten Deploy weg.
RUN mkdir -p /app/data/uploads && chown -R node:node /app/data
VOLUME ["/app/data"]

USER node
EXPOSE 3000

# Coolify prueft damit, ob der Container gesund ist.
HEALTHCHECK --interval=30s --timeout=4s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
