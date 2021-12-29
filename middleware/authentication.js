const CustomErr =  require('../errors');
const { isTokenValid, attachCookiesToResponse} = require('../utils');
const {Token} = require("../models/Token");
const {createJWT} = require("../utils/jwt");


const authenticateUser = async (req, res, next) => {
    const {accessToken, refreshToken} = req.signedCookies;

    try {
        if(accessToken) {
            const {name, id, role} = isTokenValid(accessToken);
            req.user = {name, id, role};
           return next();
        }

        const payload = isTokenValid(refreshToken);
        const isTokenExist = await Token.findOne({
            user: payload.user.id,
            refreshToken: payload.refreshToken
        });
        if(!isTokenExist || !isTokenExist?.isValid) {
            throw new CustomErr.UnauthenticatedError('Authentication invalid');
        }

        const accessTokenJWT = createJWT(payload.user);
        attachCookiesToResponse({accessTokenJWT, refreshTokenJWT:isTokenExist.refreshToken, res});
        req.user = payload.user;
        next();
    } catch (err) {
        throw new CustomErr.UnauthenticatedError('Authentication invalid');
    }
}

const authorizePermissions = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            throw new CustomErr.UnauthorizedError('You are not authorized to access this resource');
        }
        next();
    }
}

module.exports = {
    authenticateUser,
    authorizePermissions
}
