# syntax=docker/dockerfile:1
# Suitable to deploy in public servers
# Use non-root user node (created by base node image)
FROM node:18-alpine AS base
LABEL org.opencontainers.image.vendor=universiteams
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
USER node
RUN npm install
COPY --chown=node:node . .
RUN npm run build

FROM node:18-alpine AS prod
LABEL org.opencontainers.image.vendor=universiteams
WORKDIR /home/node/app
USER root
RUN apk add --no-cache tini
USER node
COPY --from=base --chown=node:node /home/node/app/dist ./dist
COPY --from=base --chown=node:node /home/node/app/node_modules ./node_modules
# Tini entrypoint ensures that the default signal handlers work for the software you run in your Docker image. 
# For example, SIGTERM (ex. by executing docker stop) properly terminates your process, allowing for graceful shut down
ENTRYPOINT ["/sbin/tini", "--", "env", "NODE_ENV=prod", "node", "./dist/main"]

# In order to avoid issues with user matching in host (dev machine) and container
# Only use during development in your personal computers
FROM base as dev
LABEL org.opencontainers.image.vendor=universiteams
USER root
RUN chown -R root:root /home/node/app/src /home/node/app/test /home/node/app/dist