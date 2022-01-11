FROM node:14-alpine

ARG APP_PORT
ARG RABBITMQ_DEFAULT_USER
ARG RABBITMQ_DEFAULT_PASS
ARG AMQP_SERVER_PORT
ARG REDIS_PORT

ENV RABBITMQ_DEFAULT_USER ${RABBITMQ_DEFAULT_USER}
ENV RABBITMQ_DEFAULT_PASS ${RABBITMQ_DEFAULT_PASS}
ENV APP_PORT ${APP_PORT}
ENV REDIS_PORT ${REDIS_PORT}
ENV AMQP_SERVER_PORT ${AMQP_SERVER_PORT}

RUN mkdir -p /app

WORKDIR /app

COPY . /app

COPY package.* /app

RUN npm install && \
    # For development environment, we want to use nodemon to keep the code running
    npm install -g nodemon && \
    npm run test

# Expose web service and nodejs debug port
EXPOSE  5000
EXPOSE  8585

ENTRYPOINT ["node", "app.js"]
