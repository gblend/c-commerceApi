const {StatusCodes} = require("http-status-codes");
const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const currency = process.env.DEFAULT_STRIPE_CURRENCY;

calculateOrderAmount = async (amount, shipping_fee) => {
    return amount + shipping_fee;
}

createCustomer = async ({name, email}) => {
    const {data:customer} = await stripe.customers.list({
        email,
        limit: 1,
    });
    if(customer.length) {
        return customer[0].id;
    }

    return stripe.customers.create({
        description: 'Customer order',
        name,
        email,
        phone: '',
        currency: currency
    });
}

paymentIntent = async ({user:customer, amount, shippingFee}) => {
    const intent = await stripe.paymentIntents.create({
        customer: await createCustomer(customer).id,
        currency: currency,
        amount: await calculateOrderAmount(amount, shippingFee),
        payment_method_types: ['card'],
        setup_future_usage: 'on_session',
    });
    return {clientSecret: intent.client_secret, amount}
}

webhookHandler = (req, res) => {
    let event;
    const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
    const sig = req.headers['stripe-signature'];

    try {
        // Verify that the events were sent by Stripe, not by a third party.
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
    catch (err) {
        return res.status(StatusCodes.BAD_REQUEST).json(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('PaymentIntent was successful!', paymentIntent);
            break;
        case 'payment_method.attached':
            const paymentMethod = event.data.object;
            console.log('PaymentMethod was attached to a Customer!', paymentMethod);
            break;
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    // Return a response to acknowledge receipt of the event
    return res.status(StatusCodes.OK).json({received: true});
}


module.exports = {
    paymentIntent,
    webhookHandler
};
