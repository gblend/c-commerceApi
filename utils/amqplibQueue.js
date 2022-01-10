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
    await channel.assertQueue(queue);
    return {channel}
}

const pushToQueue = async (queue, queueErrorMsg, data) => {
    const {channel:amqpChannel} = await createAmqpChannel(queue);
    const queueData = await amqpChannel.sendToQueue(queue, Buffer.from(JSON.stringify({ [queue]: data })));
    if (!queueData) {
        throw new CustomError.BadRequestError(queueErrorMsg);
    }
    await execConsumeQueues();
}

const initConsumeQueue = async (fn, queue) => {
    const {channel:ch} = await createAmqpChannel(queue);
    ch.consume(queue, async (data) => {
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
