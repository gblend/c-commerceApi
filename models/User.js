const mongoose = require('mongoose');
const joi = require('joi');
const schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const { createJWT } = require('../utils');

const UserSchema = new schema({
    name: {
        type: String,
        minlength: 3,
        // required: [true, 'name is required'],
    },
    email: {
        type: String,
        unique: true,
        // required: [true, 'email is required'],
    },
    password: {
        type: String,
        minlength: 8,
        // required: [true, 'password is required'],
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    }
}, {timestamps: true});

const validateUserSchema = (userSchema) => {
    const user = joi.object({
        name: joi.string().min(3).required(),
        email: joi.string().email().required(),
        password: joi.string().min(8).required()
    })

    return user.validate(userSchema);
}

const validateUpdatePassword = (payload) => {
    const password = joi.object({
        oldPassword: joi.string().min(8).required(),
        newPassword: joi.string().min(8)
            .required()
    })

    return password.validate(payload);
}

const validateUpdateUser = (userData) => {
    const userUpdate = joi.object({
        name: joi.string().min(3).required(),
        email: joi.string().email().required(),
    });

    return userUpdate.validate(userData);
}

const validateLogin = (credentials) => {
    const login = joi.object({
        email: joi.string().email().required(),
        password: joi.string().required()
    });

    return login.validate(credentials);
}

UserSchema.pre('save', async function (req, res, next) {
   if(!this.isModified('password')) {
       return;
   }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

UserSchema.methods.createJWT = function () {
    const payload = {
        name: this.name,
        id: this._id,
        role: this.role
    }
    return createJWT(payload);
}

UserSchema.methods.comparePassword =  function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
}

const User = mongoose.model('User', UserSchema);

module.exports = {
    User,
    validateUserSchema,
    validateLogin,
    validateUpdateUser,
    validateUpdatePassword
};
