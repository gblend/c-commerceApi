const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SingleOrderSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true
    }
});

const OrderSchema = new Schema({
    tax: {
        type: Number,
        required: true
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shippingFee: {
        type: Number,
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    orderItems: [SingleOrderSchema],
    status: {
        type: String,
        enum: ['pending', 'paid', 'delivered', 'canceled', 'failed'],
        default: 'pending'
    },
    clientSecret: {
        type: String,
        required: true
    },
    paymentIntentId: {
        type: String,
    }
}, { timestamps: true});


const Order = mongoose.model('Order', OrderSchema);

module.exports = {
    Order
};


