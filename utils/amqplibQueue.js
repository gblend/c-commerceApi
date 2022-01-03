const amqp = require('amqplib');
const CustomError = require('../errors/index');
const {sendVerificationEmail} = require("../utils");

let channel = '', connection = '';
const verifyQueName = process.env.VERIFY_EMAIL_QUEUE_NAME;

const connectAmqp = async (queueName) => {
    const amqpServer = process.env.AMQP_SERVER;
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue(queueName);
    return {channel}
}

const consumeVerifyEmailQueue = async () => {
    const {channel:ch} = await connectAmqp(verifyQueName);
    ch.consume(verifyQueName, async (data) => {
        const verifyPayload = JSON.parse(data.content);
        await sendVerificationEmail(verifyPayload.verifyQueName);
        ch.ack(data)
    })
}

const queueVerifyEmail = async (data) => {
    const {channel:amqpChannel} = await connectAmqp(verifyQueName);
    const queueEmail = await amqpChannel.sendToQueue(verifyQueName, Buffer.from(JSON.stringify({ verifyQueName: data })));
    if (!queueEmail) {
        throw new CustomError.BadRequestError('Unable to queue verify email, please try again');
    }
}

module.exports = {
    consumeVerifyEmailQueue,
    queueVerifyEmail,
}
