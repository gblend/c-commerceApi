const amqp = require('amqplib');
const CustomError = require('../errors/index');
const {sendVerificationEmail, sendResetPasswordEmail} = require("../utils");

let channel = '', connection = '';
const resetQueue = process.env.RESET_EMAIL_QUEUE_NAME;
const verifyQueue = process.env.VERIFY_EMAIL_QUEUE_NAME;

const initAmqpConnect = async () => {
    const amqpServer = process.env.AMQP_SERVER;
    if (!connection) {
        return amqp.connect(amqpServer);
    }
    return connection;
}

const createAmqpChannel = async (queue) => {
    connection = await initAmqpConnect();
    channel = await connection.createChannel();
    await channel.assertQueue(queue);
    return {channel}
}

const consumeVerifyEmailQueue = async () => {
    const {channel:ch} = await createAmqpChannel(verifyQueue);
    ch.consume(verifyQueue, async (data) => {
        let payload = JSON.parse(data.content);
        await sendVerificationEmail(payload[verifyQueue]);
        ch.ack(data)
    })
}

const pushEmailToQueue = async (emailQueue, operationInfo, data) => {
    const {channel:amqpChannel} = await createAmqpChannel(emailQueue);
    const queueEmail = await amqpChannel.sendToQueue(emailQueue, Buffer.from(JSON.stringify({ [emailQueue]: data })));
    if (!queueEmail) {
        throw new CustomError.BadRequestError(`Unable to ${operationInfo}, please try again`);
    }
    await consumeAmqpQueue();
}

const consumeResetPasswordEmail = async () => {
    const {channel:ch} = await createAmqpChannel(resetQueue);
    ch.consume(resetQueue, async (data) => {
        let resetPayload = JSON.parse(data.content);
        await sendResetPasswordEmail(resetPayload[resetQueue]);
        ch.ack(data)
    })
}

const consumeAmqpQueue = async () => {
    await consumeVerifyEmailQueue();
    await consumeResetPasswordEmail();
}

module.exports = {
    consumeVerifyEmailQueue,
    pushEmailToQueue,
}
