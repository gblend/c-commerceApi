const { createJWT, isTokenValid, decodeCookies, attachCookiesToResponse } = require('./jwt');
const { createTokenUser } = require('./createTokenUser');
const { checkPermissions } = require('./checkPermissions');
const {sendVerificationEmail, sendResetPasswordEmail} = require("./email/sendEmail");
const createHash = require('./createHash');

module.exports = {
    createJWT,
    isTokenValid,
    decodeCookies,
    attachCookiesToResponse,
    createTokenUser,
    checkPermissions,
    sendVerificationEmail,
    sendResetPasswordEmail,
    createHash,
}
