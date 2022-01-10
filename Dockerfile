FROM node:14-alpine

COPY . /app

WORKDIR /app

COPY package.* /app

RUN npm install && \
    # For development environment, we want to use nodemon to keep the code running
    npm install -g nodemon && \
    npm run test

# Expose web service and nodejs debug port
EXPOSE  5000
EXPOSE  8585

ENTRYPOINT ["node", "app.js"]
