const { createJWT, isTokenValid, decodeCookies, attachCookiesToResponse } = require('./jwt');
const { createTokenUser } = require('./createTokenUser');
const { checkPermissions } = require('./checkPermissions');

module.exports = {
    createJWT,
    isTokenValid,
    decodeCookies,
    attachCookiesToResponse,
    createTokenUser,
    checkPermissions
}
