const CustomError = require('../errors');

const checkPermissions = (requestUser, resourceId) => {
    if (requestUser.role !== 'admin' && requestUser.id !== resourceId.toHexString()) {
        throw new CustomError.UnauthorizedError('You are not authorized to access this resource');
    }
}

module.exports = {
    checkPermissions
}
