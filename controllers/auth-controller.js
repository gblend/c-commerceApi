const {User, validateUserSchema, validateLogin} = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const { CustomAPIError, UnauthenticatedError, BadRequestError } = require('../errors');
const { attachCookiesToResponse } = require('../utils');

const register = async (req, res) => {
    const { email, name, password } = req.body;
    const {error} = validateUserSchema(req.body);
    if (error) {
        return res.status(StatusCodes.BAD_REQUEST).json({ status: 'error', message: '', errors: error.details[0].message.split('\"').join('') });
    }

    const isEmailExist = await User.findOne( { email }) ;
    if (isEmailExist) {
        throw new CustomAPIError('This email address is already in use');
    }

    const isAdminExists = (await User.countDocuments( {role: 'admin'})) === 0;
    const role = isAdminExists ? 'admin' : 'user';

    const user = await User.create({ email, name, password, role});
    const token = await user.createJWT();
    user.password = undefined;

    attachCookiesToResponse(token, res);
    return res.status(StatusCodes.CREATED).json({ status: 'success', message: 'Account created successfully', token, data: user });
}

const login = async (req, res) => {
    const { error } = validateLogin(req.body);
    if (error) {
        return res.status(StatusCodes.BAD_REQUEST).json({ status: 'failed', message: '', errors: error.details[0].message.split('\"').join('') });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email});
    if (!user) {
        throw new BadRequestError('Invalid credentials provided');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new UnauthenticatedError('Invalid email or password');
    }

    const token = await user.createJWT();
    user.password = undefined;
    attachCookiesToResponse(token, res);
    return res.json({ status: 'success', message: 'Login successful', token, data: user });
}

const logout = async (req, res) => {
    req.cookies.token = undefined;
    req.user = undefined
    res.clearCookie('token');

    res.status(StatusCodes.NO_CONTENT).json({status: 'success', message: 'Logout successful', data: {}});
}

module.exports = {
    register,
    logout,
    login
}
