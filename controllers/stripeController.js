const {webhookHandler} = require('../utils/stripeapi');

const stripeWebhookHandler = async (req, res) => {
    webhookHandler(req, res);
}

module.exports = {
    stripeWebhookHandler
}
