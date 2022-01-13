const amqp = require('amqplib');
const CustomError = require('../errors/index');
const {sendVerificationEmail, sendResetPasswordEmail} = require("../utils");

let channel = '', connection = '';
const resetQueue = process.env.RESET_EMAIL_QUEUE_NAME;
const verifyQueue = process.env.VERIFY_EMAIL_QUEUE_NAME;

const initAmqpServer = async () => {
    const amqpServer = `amqp://${process.env.AMQP_SERVER_HOST}:${process.env.AMQP_SERVER_PORT}`;
    if (!connection) {
        return amqp.connect(amqpServer);
    }
    return connection;
}

const createAmqpChannel = async (queue) => {
    connection = await initAmqpServer();
    channel = await connection.createChannel();
    channel.assertExchange(queue, 'direct', {durable: true});
    await channel.assertQueue(queue);
    return {channel}
}

const pushToQueue = async (queue, queueErrorMsg, data) => {
    const {channel:amqpChannel} = await createAmqpChannel(queue);
    // The empty string as second parameter means that we don't want to send the message to any specific queue (routingKey).
    // We want only to publish it to our exchange
    const pubData = amqpChannel.publish(queue, '', Buffer.from(data));
    console.log('Published data', pubData);
    const queueData = await amqpChannel.sendToQueue(queue, Buffer.from(JSON.stringify({ [queue]: data })));
    console.log('queueData', queueData);
    if (!queueData) {
        throw new CustomError.BadRequestError(queueErrorMsg);
    }
    await execConsumeQueues();
}

const initConsumeQueue = async (fn, queue) => {
    const {channel:ch} = await createAmqpChannel(queue);
    ch.assertExchange(queue, 'direct', {durable: true});
    // The third parameter empty string means any type - fanout, direct, topic, header
    ch.bindQueue(queue, queue, '');
    ch.consume(queue, async (data) => {
        console.log('routingKey', data.fields.routingKey);
        let queuePayload = JSON.parse(data.content);
        await fn(queuePayload[queue]);
        ch.ack(data)
    })
}

const execConsumeQueues = async () => {
    await initConsumeQueue(sendVerificationEmail, verifyQueue);
    await initConsumeQueue(sendResetPasswordEmail, resetQueue);
}

module.exports = {
    pushToQueue,
}
