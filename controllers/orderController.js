const { StatusCodes } = require('http-status-codes');
const CustomError = require("../errors");
const {Product} = require("../models/Product");
const {Order} = require("../models/Order");
const {checkPermissions} = require("../utils");
const {redisRefreshCache, redisGetBatchRecords, redisSetBatchRecords} = require("../utils/redis");
const {paymentIntent} = require("../utils/stripeapi");
const {User} = require("../models/User");
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
    const user = await User.findOne({ _id: req.user.id});
    req.user.email = user.email;

    const pmtIntent = await paymentIntent({user: req.user, amount: total, shippingFee});
    const order = {
        orderItems,
        tax,
        shippingFee,
        subtotal,
        total,
        user: req.user.id,
        clientSecret: pmtIntent.clientSecret
    }
    const newOrder = await Order.create(order);
    await redisRefreshCache(allOrdersCacheKey);
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
    let allOrders = await redisGetBatchRecords(allOrdersCacheKey);
    if (!allOrders.length) {
        allOrders = await Order.find({});
        if (!allOrders.length) {
            throw new CustomError.BadRequestError(`No order found`);
        }
        await redisSetBatchRecords(allOrdersCacheKey, allOrders);
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
    await redisRefreshCache(allOrdersCacheKey);
    res.json({status: StatusCodes.OK, message: '', data: order});
}

module.exports = {
    getSingleOrder,
    getAllOrders,
    getCurrentUserOrders,
    createOrder,
    updateOrder
}
