const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const joi = require('joi');

const ProductSchema = new Schema({
    name: {
        type: String,
        trim: true,
    },
    price: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    image: {
        type: String,
        default: '/uploads/product-sample.jpeg'
    },
    category: {
        type: String,
        enum: ['office', 'kitchen', 'bedroom']
    },
    company: {
        type: String,
        enum: {
            values: ['ikea', 'liddy', 'marcos'],
            message: '{VALUE} is not allowed'
        }
    },
    colors: {
        type: [String],
        default: ['#000']
    },
    featured: {
        type: Boolean,
        default: false
    },
    freeShipping: {
        type: Boolean,
        default: false
    },
    inventory: {
        type: Number,
        default: 0
    },
    averageRating: {
       type: Number,
        default: 0
    },
    numberOfReviews: {
        type: Number,
        default: 0
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
}, { timestamps: true, toJSON: {virtuals: true}, toObject: {virtuals: true} });

ProductSchema.virtual('reviews',{
   ref: 'Review',
   localField: '_id',
   foreignField: 'product',
   justOne: false
});

ProductSchema.pre('remove', async function(next) {
    await this.model('Review').deleteMany({product: this._id});
    next();
});
const Product = mongoose.model('Product', ProductSchema);

const validateProductSchema = (productData) => {
    const product = joi.object({
        name: joi.string().min(3).required(),
        price: joi.number().required(),
        description: joi.string().min(10).required(),
        image: joi.string().uri(),
        category: joi.string().min(3).required(),
        company: joi.string().min(3).required(),
        colors: joi.array(),
        featured: joi.boolean(),
        freeShipping: joi.boolean(),
        inventory: joi.number(),
        averageRating: joi.number(),
        user: joi.object().required(),
    });

    return product.validate(productData);
}

module.exports = {
    Product,
    validateProductSchema
}
