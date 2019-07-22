# Use latest LTS
FROM node:10.16.0-alpine

WORKDIR /usr/Spoke

# Cache dependencies
COPY package.json .
RUN npm install

# Configure build environment
ARG PHONE_NUMBER_COUNTRY=US
ENV NODE_ENV=production \
  OUTPUT_DIR=./build \
  PHONE_NUMBER_COUNTRY=$PHONE_NUMBER_COUNTRY

# Copy application codebase
COPY . .
RUN npm run prod-build

# Run the production compiled code
EXPOSE 3000
CMD [ "npm", "run", "start" ]
