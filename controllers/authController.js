const {User, validateUserSchema, validateLogin} = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const { CustomAPIError, UnauthenticatedError, BadRequestError } = require('../errors');
const { attachCookiesToResponse, createHash } = require('../utils');
const {generateToken} = require("../utils/verificationToken");
const {Token} = require("../models/Token");
const {pushToQueue} = require("../utils/amqplibQueue");

let queueName = '', queueErrorMsg = '';

const register = async (req, res) => {
    const { email, name, password } = req.body;
    const {error} = validateUserSchema(req.body);
    if (error) {
        return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: '', errors: error.details[0].message.split('\"').join('') });
    }

    const isEmailExist = await User.findOne( { email });
    if (isEmailExist) {
        throw new CustomAPIError('This email address is already in use');
    }

    const isAdminExists = (await User.countDocuments( {role: 'admin'})) === 0;
    const role = isAdminExists ? 'admin' : 'user';

    const verificationToken = generateToken();
    const user = await User.create({ email, name, password, role, verificationToken});
    const accessTokenJWT = await user.createJWT();
    // send verify email via queue
    queueErrorMsg = 'Unable to queue verify email, please try again';
    queueName = process.env.VERIFY_EMAIL_QUEUE_NAME;
    await pushToQueue(queueName, queueErrorMsg,{name:user.name, email:user.email, verificationToken:user.verificationToken})
    user.password = undefined;

    const tokenInfo = await saveTokenInfo(user, req);
    const refreshTokenJWT = await user.createRefreshJWT(user, tokenInfo.refreshToken);
    attachCookiesToResponse({accessTokenJWT, refreshTokenJWT, res});
    return res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Please check your email for a link to verify your account', token: accessTokenJWT, refreshToken: refreshTokenJWT, data: user});
}

const login = async (req, res) => {
    let verificationMsg = '';
    const { error } = validateLogin(req.body);
    if (error) {
        return res.status(StatusCodes.BAD_REQUEST).json({ status: StatusCodes.BAD_REQUEST, message: '', errors: error.details[0].message.split('\"').join('') });
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
    if(!user.isVerified) {
        verificationMsg = 'Please verify your email to get full access to your account capabilities';
    }

    const accessTokenJWT = await user.createJWT();
    user.password = undefined;
    const tokenInfo = await saveTokenInfo(user, req);
    const refreshTokenJWT = await user.createRefreshJWT(user, tokenInfo.refreshToken);

    attachCookiesToResponse({accessTokenJWT, refreshTokenJWT, res});
    return res.json({ status: StatusCodes.OK, message: 'Login successful', token: accessTokenJWT, refreshToken: refreshTokenJWT, data: user, verificationMsg });
}

const logout = async (req, res) => {
    await Token.findOneAndDelete({user: req.user.id});

    req.signedCookies.accessToken = undefined;
    req.signedCookies.refreshToken = undefined;
    req.user = undefined
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(StatusCodes.NO_CONTENT).json({status: StatusCodes.NO_CONTENT, message: 'Logout successful', data: {}});
}

const forgotPassword = async (req, res) => {
    const {email} = req.body;
    if (!email) {
        throw new BadRequestError('Please enter a valid email');
    }

    const user = await User.findOne({email});
    if (user) {
        const passwordToken = generateToken();

        // queue reset password email
        queueErrorMsg = 'Unable to queue reset password email, please try again';
        queueName = process.env.RESET_EMAIL_QUEUE_NAME;
        await pushToQueue(queueName, queueErrorMsg, {name:user.name, email:user.email, passwordToken});

        const tenMinutes = 1000 * 10 * 60;
        const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);
        user.passwordToken = createHash(passwordToken);
        user.passwordTokenExpirationDate = passwordTokenExpirationDate;
        await user.save();
    }
    res.status(StatusCodes.OK).json({status: StatusCodes.OK, message: 'Please check your email for reset link'});
}

const resetPassword = async (req, res) => {
    const {email, token, password} = req.body;
    if (!email || !token || !password) {
        throw new BadRequestError('Please provide all values');
    }

    const user = await User.findOne({email});
    if (user) {
        const currentDate = new Date();
        if(user.passwordTokenExpirationDate < currentDate) {
            throw new BadRequestError('Password reset link has expired');
        }
        if(user.passwordToken === createHash(token)) {
           user.passwordTokenExpirationDate = null;
           user.passwordToken = '';
           user.password = password;
           await user.save();
        }
    }
    res.status(StatusCodes.OK).json({status: StatusCodes.OK, message: 'Password changed successfully. Redirecting to login page'});
}

const verifyEmail = async (req, res) => {
    const { email, token} = req.body;
    const user = await User.findOne({ email});
    if (!user) {
        throw new UnauthenticatedError('Verification failed');
    }
    if (user.verificationToken !== token) {
        throw new UnauthenticatedError('Verification failed, invalid token');
    }

    user.isVerified = true;
    user.verificationToken = '';
    user.verified = Date.now();
    user.save();
    res.status(StatusCodes.OK).json({ status: StatusCodes.OK, message: 'Email successfully verified'});
}

const saveTokenInfo = async ({_id:userId}, req) => {
    const isTokenExist = await Token.findOne({user:userId});
    if(isTokenExist) {
        if(!isTokenExist.isValid) {
            throw new UnauthenticatedError('Invalid credentials');
        }
        return isTokenExist;
    }
    const refreshToken = generateToken();
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const userToken = {refreshToken, ip, userAgent, user: userId};
    return Token.create(userToken);
}

module.exports = {
    register,
    logout,
    login,
    resetPassword,
    forgotPassword,
    verifyEmail
}
