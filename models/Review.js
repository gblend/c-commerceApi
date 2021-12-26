const mongoose = require('mongoose');
const joi = require('joi');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
    rating: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        trim: true,
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true
    },
}, { timestamps: true });

ReviewSchema.index({product: 1, user: 1}, { unique: true });

ReviewSchema.statics.calculateAverageRating = async function(productId) {
    const result = await this.aggregate([
        { $match: { product: productId } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                numberOfReviews: { $sum: 1 }
            }
        }
    ]);
    await this.model('Product').findOneAndUpdate({_id: productId}, {
        averageRating: Math.ceil(result[0]?.averageRating || 0),
        numberOfReviews: Math.ceil(result[0].numberOfReviews || 0)
    })
}

ReviewSchema.post('save', async function() {
    await this.constructor.calculateAverageRating(this.product);
});

ReviewSchema.post('remove', async function(){
    await this.constructor.calculateAverageRating(this.product);
});

const Review = mongoose.model('Review', ReviewSchema);

const validateReviewSchema = (reviewSchema) => {
    const review = joi.object({
        rating: joi.number().min(1).max(5).required(),
        title: joi.string().required(),
        comment: joi.string().required(),
        user: joi.object().required(),
        product: joi.object().required()
    });
    return review.validate(reviewSchema);
}

module.exports = {
    Review,
    validateReviewSchema
}
