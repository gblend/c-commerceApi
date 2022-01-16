const stripe = require('stripe')(process.env.STRIPE_API_KEY);

class StripeApi {

    constructor({customer, amount, currency, shipping_fee}) {
        this.customer = customer;
        this.amount = amount;
        this.currency = currency;
        this.shipping_fee = shipping_fee;
    }

    calculateOrderAmount = () => {
        return this.amount + this.shipping_fee;
    }

    createCustomer = () => {
        return stripe.customers.create({
            description: 'New customer order',
            email: this.customer.email,
            id: this.customer.id
        });
    }

    paymentIntent = async () => {
        const intent = await stripe.paymentIntents.create({
            customer: this.createCustomer().id,
            currency: this.currency,
            amount: this.calculateOrderAmount(),
            payment_method_types: ['card', 'alipay', 'wechat_pay'],
            setup_future_usage: 'on_session',
        });

        return {clientSecret: intent.client_secret, amount: this.amount}
    }

    webhookHandler = (req, res) => {
        const event = req.body;
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
    }
}


module.exports = StripeApi;
