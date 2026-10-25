# Publication image for the existing openGym API.
# The static frontend is published separately from frontend/dist; this container owns /api.
FROM node:22-alpine

WORKDIR /app
COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev --omit=optional && npm cache clean --force
COPY api/ ./

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
