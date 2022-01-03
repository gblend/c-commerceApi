const amqp = require('amqplib');
const CustomError = require('../errors/index');
const {sendVerificationEmail, sendResetPasswordEmail} = require("../utils");

let channel = '', connection = '';
const verifyEmailQue = process.env.VERIFY_EMAIL_QUEUE_NAME;
const resetEmailQueue = process.env.RESET_EMAIL_QUEUE_NAME;

const connectAmqp = async (queueName) => {
    const amqpServer = process.env.AMQP_SERVER;
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue(queueName);
    return {channel}
}

const consumeVerifyEmailQueue = async () => {
    const {channel:ch} = await connectAmqp(verifyEmailQue);
    ch.consume(verifyEmailQue, async (data) => {
        const verifyPayload = JSON.parse(data.content);
        await sendVerificationEmail(verifyPayload.verifyQueName);
        ch.ack(data)
    })
}

const queueVerifyEmail = async (data) => {
    const {channel:amqpChannel} = await connectAmqp(verifyEmailQue);
    const queueEmail = await amqpChannel.sendToQueue(verifyEmailQue, Buffer.from(JSON.stringify({ verifyEmailQue: data })));
    if (!queueEmail) {
        throw new CustomError.BadRequestError('Unable to queue verify email, please try again');
    }
}

const queueResetPasswordEmail = async (data) => {
    const {channel:amqpChannel} = await connectAmqp(resetEmailQueue);
    const queueEmail = await amqpChannel.sendToQueue(resetEmailQueue, Buffer.from(JSON.stringify({ resetEmailQueue: data })));
    if (!queueEmail) {
        throw new CustomError.BadRequestError('Unable to queue reset password email, please try again');
    }
}

const consumeResetPasswordEmail = async () => {
    const {channel:ch} = await connectAmqp(resetEmailQueue);
    ch.consume(resetEmailQueue, async (data) => {
        const resetPayload = JSON.parse(data.content);
        await sendResetPasswordEmail(resetPayload.resetEmailQueue);
        ch.ack(data)
    })
}

const consumeAmqpQueue = async () => {
    await consumeVerifyEmailQueue();
    await consumeResetPasswordEmail();
}

module.exports = {
    consumeVerifyEmailQueue,
    queueVerifyEmail,
    consumeAmqpQueue,
    queueResetPasswordEmail,
}
