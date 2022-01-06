const { StatusCodes } = require('http-status-codes');
const { Product, validateProductSchema } = require('../models/Product');
const CustomError = require('../errors');
const mongoose = require("mongoose");
const { uploadProductImage } = require('../utils/uploadsController');
const {paginator} = require("../utils/pagination");
const {redisRefreshCache, redisSetBatchRecords, redisGetBatchRecords} = require("../utils/redis");
const allProductsCacheKey = process.env.GET_ALL_PRODUCTS_CACHE_KEY;

const createProduct = async (req, res) => {
    req.body.user = new mongoose.Types.ObjectId(req.user.id);
    const { error } = validateProductSchema(req.body);
    if(error) {
        return res.status(StatusCodes.BAD_REQUEST)
            .json({ status: 'error', message: '', errors: error.details[0].message.split('\"').join('') });
    }
    const product = await Product.create(req.body);
    await redisRefreshCache(allProductsCacheKey);
    return res.status(StatusCodes.CREATED)
        .json({ status: 'success', message: 'Product created successfully', data: product });
}

const getAllProducts = async (req, res) => {
    let products = await redisGetBatchRecords(allProductsCacheKey);
    if (!products.length) {
        products = await Product.find({});
        if (!products) {
            throw new CustomError.NotFoundError('No products found');
        }

        await redisSetBatchRecords(allProductsCacheKey, products);
    }
    const total = await Product.countDocuments().exec();
    return res.status(StatusCodes.OK)
        .json({
                status: "success",
                message: 'Products fetched successfully',
                data: {
                    total,
                    products
                }
            });
}

const getSingleProduct = async (req, res) => {
    const { id:productId } = req.params;
    const product = await Product.findOne({ _id: productId }).populate('reviews');
    if(!product) {
        throw new CustomError.BadRequestError(`Product with id ${productId} not found`);
    }
    return res.status(StatusCodes.OK).json({ status: 'success', message: 'Product fetched successfully', data: product });
}

const updateProduct = async (req, res) => {
    const { id:productId } = req.params;
    const product = await Product.findOneAndUpdate({ _id: productId }, req.body, { new: true, runValidators: true });
    await redisRefreshCache(allProductsCacheKey);
    return res.status(StatusCodes.OK).json({ status: 'success', message: 'Product updated successfully', data: product });
}

const deleteProduct = async (req, res) => {
    const { id:productId } = req.params;
    const product = await Product.findOne({ _id: productId });
    if(!product) {
        throw new CustomError.BadRequestError(`Product with id ${productId} not found`);
    }
    product.remove();
    await redisRefreshCache(allProductsCacheKey);
    return res.status(StatusCodes.NO_CONTENT).json({ status: 'success', message: `Product with id ${id} deleted successfully`, data: {} });
}

const uploadImage = async (req, res) => {
    const {secure_url} = await uploadProductImage(req, res);
    res.status(StatusCodes.OK).json({ status: 'success', message: '', secure_url});
}

module.exports = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    uploadImage
}
