FROM node:lts-alpine3.15

COPY . /app

WORKDIR /app

COPY package.* /app

RUN npm install && \
npm run test

CMD ['node', 'app.js']
