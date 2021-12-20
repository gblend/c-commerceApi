const { StatusCodes } = require('http-status-codes');
const { Product, validateProductSchema } = require('../models/Product');
const CustomError = require('../errors');
const mongoose = require("mongoose");
const { uploadProductImage } = require('../utils/uploadsController');
const {paginator} = require("../utils/pagination");

const createProduct = async (req, res) => {
    req.body.user = new mongoose.Types.ObjectId(req.user.id);
    const { error } = validateProductSchema(req.body);
    if(error) {
        return res.status(StatusCodes.BAD_REQUEST)
            .json({ status: 'error', message: '', errors: error.details[0].message.split('\"').join('') });
    }
    const product = await Product.create(req.body);
    return res.status(StatusCodes.CREATED)
        .json({ status: 'success', message: 'Product created successfully', data: product });
}

const getAllProducts = async (req, res) => {
    const products = await Product.find({});
    if(!products) {
        throw new CustomError.NotFoundError('No products found');
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
    const product = await Product.findOne({ _id: productId });
    if(!product) {
        throw new CustomError.BadRequestError(`Product with id ${productId} not found`);
    }
    return res.status(StatusCodes.OK).json({ status: 'success', message: 'Product fetched successfully', data: product });
}

const updateProduct = async (req, res) => {
    const { id:productId } = req.params;
    const product = await Product.findOneAndUpdate({ _id: productId }, req.body, { new: true, runValidators: true });
    return res.status(StatusCodes.OK).json({ status: 'success', message: 'Product updated successfully', data: product });
}

const deleteProduct = async (req, res) => {
    const { id:productId } = req.params;
    const product = await Product.findOne({ _id: productId });
    if(!product) {
        throw new CustomError.BadRequestError(`Product with id ${productId} not found`);
    }
    product.remove();
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
