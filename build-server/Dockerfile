FROM node:22-alpine

RUN apk add --no-cache git bash

WORKDIR /home/app

COPY main.sh main.sh
COPY script.js script.js
COPY package*.json .
COPY .env .env

RUN npm install

RUN chmod +x main.sh
RUN chmod +x script.js

ENTRYPOINT ["/home/app/main.sh"]
