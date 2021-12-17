const CustomErr =  require('../errors');
const { isTokenValid } = require('../utils');


const authenticateUser = async (req, res, next) => {
    const token = req.signedCookies.token;

    if (!token) {
        throw new CustomErr.UnauthenticatedError('error, no token present');
    }

    try {
        const {name, id, role} = isTokenValid(token);
        req.user = {name, id, role};
        next();
    } catch (err) {
        throw new CustomErr.UnauthenticatedError('error, authentication failed');
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
