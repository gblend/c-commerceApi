const { StatusCodes } = require('http-status-codes');
const { Product, validateProductSchema } = require('../models/Product');
const CustomError = require('../errors');
const mongoose = require("mongoose");

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
    const { pageSize, pageNumber } = req.params;
    const pagination = {
        pageSize: Number(pageSize? pageSize : 10),
        pageNumber: Number(pageNumber? pageNumber : 1)
    }
    pagination.offset = Number((pagination.pageNumber - 1) * pagination.pageSize);

    const products = Product.find({});
    if(!products) {
        throw new CustomError.NotFoundError('No products found');
    }

    const productData = await products.skip(pagination.offset).limit(pagination.pageSize)
    const total = await Product.countDocuments().exec();
    return res.status(StatusCodes.OK)
        .json({
                status: "success",
                message: 'Products fetched successfully',
                data: {
                    total,
                    current: pagination.pageNumber,
                    pages: Math.ceil(total / pagination.pageSize),
                    productData
                }
            });
}

const getSingleProduct = async (req, res) => {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id });
    if(!product) {
        throw new CustomError.BadRequestError(`Product with id ${id} not found`);
    }
    return res.status(StatusCodes.OK).json({ status: 'success', message: 'Product fetched successfully', data: product });
}

const updateProduct = async (req, res) => {
    const { id } = req.params;
    const product = await Product.findOneAndUpdate({ _id: id }, req.body, { new: true, runValidators: true });
    return res.status(StatusCodes.OK).json({ status: 'success', message: 'Product updated successfully', data: product });
}

const deleteProduct = async (req, res) => {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id });
    if(!product) {
        throw new CustomError.BadRequestError(`Product with id ${id} not found`);
    }
    product.remove();
    return res.status(StatusCodes.NO_CONTENT).json({ status: 'success', message: `Product with id ${id} deleted successfully`, data: {} });
}

const uploadImage = (req, res) => {
    return res.send('upload image');
}

module.exports = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    uploadImage
}
