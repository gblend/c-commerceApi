const { StatusCodes } = require('http-status-codes');
const CustomError = require("../errors");
const {Product} = require("../models/Product");
const {Order} = require("../models/Order");
const fakeStripeApi = require("../utils/stripeapi");
const {checkPermissions} = require("../utils");
const {redisGet, redisSet, redisDelete} = require("../utils/redis");
const allOrdersCacheKey = process.env.GET_ALL_ORDERS_CACHE_KEY;

const createOrder = async (req, res) => {
    const {items:cartItems, tax, shippingFee} = req.body;
    if (!cartItems || cartItems.length < 1) {
        throw new CustomError.BadRequestError('No cart items provided');
    }

    if (!tax || !shippingFee) {
        throw new CustomError.BadRequestError('Tax and shipping fee is required');
    }

    let orderItems = [];
    let subtotal = 0;
    for(const item of cartItems) {
        const dbProduct = await Product.findOne({_id: item.product});
        if (!dbProduct) {
            throw new CustomError.BadRequestError(`No product with id ${item.product}`);
        }
        const singleOrderItem = {
            name: dbProduct.name,
            price: dbProduct.price,
            quantity: item.quantity,
            image: dbProduct.image,
            product: dbProduct._id
        }
        subtotal += item.quantity * dbProduct.price;
        orderItems.push(singleOrderItem);
    }
    const total = tax + shippingFee + subtotal;
    const paymentIntent = await fakeStripeApi({amount: total, currency:'usd'});
    const order = {
        orderItems,
        tax,
        shippingFee,
        subtotal,
        total,
        user: req.user.id,
        clientSecret: paymentIntent.clientSecret
    }
    const newOrder = await Order.create(order);
    await redisDelete(allOrdersCacheKey);
    res.json({status: StatusCodes.OK, message: '', data: newOrder});
}
const getSingleOrder = async (req, res) => {
    const {id:orderId} = req.params;
    const order = await Order.findOne({id: orderId});
    checkPermissions(req.user, order.user)
    if (!order) {
        throw new CustomError.BadRequestError(`Order with id ${orderId} not found`);
    }
    res.json({status: StatusCodes.OK, message: '', data: order});
}
const getCurrentUserOrders = async (req, res) => {
    const {id:userId} = req.params;
    const userOrders = await Order.find({user: userId});
    if (!userOrders.length) {
        throw new CustomError.BadRequestError(`You do not have any order yet.`);
    }
    res.json({status: StatusCodes.OK, message: '', data: userOrders});
}
const getAllOrders = async (req, res) => {
    let allOrders = await redisGet(allOrdersCacheKey);
    if (!allOrders) {
        allOrders = await Order.find({});
        if (!allOrders.length) {
            throw new CustomError.BadRequestError(`No order found`);
        }
        await redisSet(allOrdersCacheKey, allOrders);
    }
    res.json({status: StatusCodes.OK, message: '', total: allOrders.length, data: allOrders});
}
const updateOrder = async (req, res) => {
    const {id:orderId} = req.params;
    const {paymentIntentId} = req.body;
    const order = await Order.findOne({id: orderId});
    checkPermissions(req.user, order.user)
    if (!order) {
        throw new CustomError.BadRequestError(`Order with id ${orderId} not found`);
    }
    order.status = 'paid';
    order.paymentIntentId = paymentIntentId;
    await order.save();
    await redisDelete(allOrdersCacheKey);
    res.json({status: StatusCodes.OK, message: '', data: order});
}

module.exports = {
    getSingleOrder,
    getAllOrders,
    getCurrentUserOrders,
    createOrder,
    updateOrder
}
