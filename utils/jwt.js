const jwt = require('jsonwebtoken');

const createJWT = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION});
}

const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET);

const attachCookiesToResponse = (token, res) => {
    const oneDay = 60 * 60 * 24 * 1000;
    res.cookie('token', token,
        {
            expires: new Date(Date.now() + oneDay),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            signed: true
        });
}

const decodeCookies = async (req, res, next) => {
    const { token } = req.signedCookies || req.cookies;
    req.user = await jwt.decode(token);

    next();
}

module.exports = {
    createJWT,
    isTokenValid,
    attachCookiesToResponse,
    decodeCookies
}
