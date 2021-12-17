const {User, validateUpdateUser, validateUpdatePassword} = require("../models/User");
const {StatusCodes} = require("http-status-codes");
const NotFoundError = require("../errors/not-found");
const mongoose = require("mongoose");
const {BadRequestError, UnauthenticatedError, UnauthorizedError} = require("../errors");
const {attachCookiesToResponse, checkPermissions} = require("../utils");

const getAllUsers = async (req, res) => {
    const users = await User.find({role: 'user'}).select('-password');
    if (!users.length) {
        throw new NotFoundError('No user found');
    }
    return res.status(StatusCodes.OK).json({ status: 'success', message: 'Users fetched successfully', data: users });
}

const getAllAdmins = async (req, res) => {
    const admins = await User.find({role: 'admin'}).select('-password');
    if (!admins.length) {
        throw new NotFoundError('No admin found');
    }
    return res.status(StatusCodes.OK).json({ status: 'success', message: 'Admins fetched successfully', data: admins });
}

const getSingleUser = async (req, res) => {
    const {id} = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestError('Invalid user id');
    }
    const user = await User.findOne({_id: id}).select('-password');
    if (!user) {
        throw new NotFoundError(`User with id ${id} does not exist`);
    }
    checkPermissions(req.user, user._id);
    return res.status(StatusCodes.OK).json({ status: 'success', message: 'User fetched successfully', data: user });
}

const showCurrentUser = async (req, res) => {
    const user =  req.user;
    if(!user) {
        throw new UnauthenticatedError(`Unauthorized access`);
    }

    return res.status(StatusCodes.OK).json({ status: 'success', message: 'User fetched successfully', data: user });
}

const updateUser = async (req, res) => {
    const {id:userId} = req.user;
    const { error } = validateUpdateUser(req.body);
    if (error) {
        return res.status(StatusCodes.BAD_REQUEST).json({ status: 'error', message: '', errors: error.details[0].message.split('\"').join('') });
    }
    const user = await User.findOneAndUpdate({ _id: userId }, req.body);
    const token = await user.createJWT();
    user.password = undefined;

    attachCookiesToResponse(token, res);
    return res.status(StatusCodes.OK).json({ status: 'success', message: 'Information updated successfully', token, data: user });
}

const updateUserPassword = async (req, res) => {
    const { newPassword, oldPassword } = req.body;
    const { error } = validateUpdatePassword(req.body);
    const { id:userId } = req.user;
    if (error) {
        return res.status(StatusCodes.BAD_REQUEST).json({ status: 'error', message: '', errors: error.details[0].message.split('\"').join('') });
    }
    if(newPassword.toLowerCase() === oldPassword.toLowerCase()) {
        throw new BadRequestError('New password must not be the same as old password');
    }
    const user = await User.findOne({ _id: userId });
    if(!user) {
        throw new UnauthorizedError(`Unauthorized access`);
    }
    const isPasswordMatch = await user.comparePassword(oldPassword);
    if(!isPasswordMatch) {
        throw new UnauthorizedError('Password mismatch');
    }
    user.password = newPassword;
    await user.save();
    return res.status(StatusCodes.OK).json({ status: 'success', message: 'Password was updated successfully', data: {} })
}

module.exports = {
    getAllUsers,
    getAllAdmins,
    getSingleUser,
    showCurrentUser,
    updateUser,
    updateUserPassword
}
