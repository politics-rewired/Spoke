# Use latest LTS
FROM node:10.16.0-alpine
WORKDIR /usr/Spoke
ENV OUTPUT_DIR=/Spoke/build
COPY package.json .
RUN npm install
COPY . .
RUN npm run prod-build
EXPOSE 3000
CMD [ "npm", "run", "start" ]

