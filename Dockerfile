# syntax=docker/dockerfile:1
# Suitable to deploy in public servers
# Use non-root user node (created by base node image)
FROM node:14-alpine AS base
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
USER node
RUN npm install
COPY --chown=node:node . .
RUN npm run build

# In order to avoid issues with user matching in host (dev machine) and container
# Only use during development in your personal computers
FROM base as dev
USER root
RUN chown -R root:root /home/node/app/src
RUN chown -R root:root /home/node/app/test
RUN chown -R root:root /home/node/app/dist