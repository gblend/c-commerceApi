const {StatusCodes} = require("http-status-codes");
const mongoose = require("mongoose");
const { validateReviewSchema, Review } = require("../models/Review");
const CustomError = require("../errors");
const {Product} = require("../models/Product");
const {checkPermissions} = require("../utils");
const {paginator} = require("../utils/pagination");

const createReview = async (req, res) => {
    const { product:productId } = req.body;
    req.body.user = new mongoose.Types.ObjectId(req.user.id);
    req.body.product = new mongoose.Types.ObjectId(req.body.product);
    const { error } = validateReviewSchema(req.body);
    if (error) {
       return res.status(StatusCodes.BAD_REQUEST).json({ status: 'error', message: '',  errors: error.details[0].message });
    }

    const isProductExist = await Product.findOne({_id: productId});
    if (!isProductExist) {
        throw new CustomError.BadRequestError(`Product with id ${productId} not found`)
    }

    const isReviewExist = await Review.findOne({product: productId, user: req.body.user});
    if (isReviewExist) {
        throw new CustomError.BadRequestError(`You already left a review for this product`)
    }
    const review = await Review.create(req.body);
    res.status(StatusCodes.OK).json({status: 'success', message: '', data: review });
}

const getAllReviews = async (req, res) => {
    const reviews = await Review.find({})
        .populate({path: 'product', select: ['name', 'company', 'price']})
        .populate({path: 'user', select: 'name'});
    if(!reviews) {
        throw new CustomError.NotFoundError('No reviews found');
    }

    const total = await Review.countDocuments().exec();
    return res.status(StatusCodes.OK)
        .json({
            status: "success",
            message: 'Reviews fetched successfully',
            data: {
                total,
                reviews
            }
        });
}

const getSingleReview = async (req, res) => {
    const { id:reviewId } = req.params;

    const review = await Review.findOne({ _id: reviewId})
        .populate({path: 'product', select: ['name', 'company', 'price']})
        .populate({path: 'user', select: 'name'});
    if(!review) {
        throw new CustomError.NotFoundError(`Review with id ${reviewId} not found`);
    }

    res.status(StatusCodes.OK).json({status: 'success', message: '', data: review });
}

const updateReview = async (req, res) => {
    const { id:reviewId } = req.params;
    const { rating, title, comment } = req.body;
    const review = await Review.findOne({ _id: reviewId});
    if(!review) {
        throw new CustomError.NotFoundError(`Review with id ${reviewId} not found`);
    }
    review.rating = rating? rating : review.rating;
    review.title = title? title : review.title;
    review.comment = comment? comment : review.comment;

    checkPermissions(req.user, review.user);
    await review.save();
    res.status(StatusCodes.OK).json({status: 'success', message: '', data: review });
}

const deleteReview = async (req, res) => {
    const { id:reviewId } = req.params;
    const review = await Review.findOne({ _id: reviewId});
    if(!review) {
        throw new CustomError.NotFoundError(`Review with id ${reviewId} not found`);
    }
    checkPermissions(req.user, review.user);
    await review.remove();
    res.status(StatusCodes.NO_CONTENT).json({status: 'success', message: '', data: {} });
}

module.exports = {
    createReview,
    getAllReviews,
    getSingleReview,
    updateReview,
    deleteReview
}
