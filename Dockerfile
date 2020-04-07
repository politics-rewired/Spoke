### Fat Build
### -------------------------
FROM node:12.16.1-alpine AS builder

WORKDIR /usr/Spoke

# Cache dependencies
COPY package.json yarn.lock ./
RUN yarn install

# Configure build environment
ARG PHONE_NUMBER_COUNTRY=US
ENV NODE_ENV="production" \
  NODE_OPTIONS=--max_old_space_size=2048 \
  PORT=3000 \
  OUTPUT_DIR="./build" \
  PUBLIC_DIR="./build/client" \
  ASSETS_DIR="./build/client/assets" \
  ASSETS_MAP_FILE="assets.json" \
  PHONE_NUMBER_COUNTRY=$PHONE_NUMBER_COUNTRY

# Copy application codebase
COPY . .
RUN yarn run build


### Slim Deploy
### -------------------------
FROM node:12.16.1-alpine

WORKDIR /usr/Spoke

# Install and cache production dependencies
COPY package.json yarn.lock ./
RUN yarn install --production

# Copy only the built source
COPY --from=builder /usr/Spoke/build ./build

ARG SPOKE_VERSION="no-version"
ARG PHONE_NUMBER_COUNTRY=US
ENV NODE_ENV="production" \
  NODE_OPTIONS=--max_old_space_size=2048 \
  PORT=3000 \
  OUTPUT_DIR="./build" \
  PUBLIC_DIR="./build/client" \
  ASSETS_DIR="./build/client/assets" \
  ASSETS_MAP_FILE="assets.json" \
  PHONE_NUMBER_COUNTRY=$PHONE_NUMBER_COUNTRY \
  SPOKE_VERSION=$SPOKE_VERSION

# Run the production compiled code
EXPOSE 3000
CMD [ "node", "--no-deprecation", "./build/src/server" ]
