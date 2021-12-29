const jwt = require('jsonwebtoken');

const createJWT = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET);
}

const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET);

const attachCookiesToResponse = ({accessTokenJWT, refreshTokenJWT, res}) => {
    const oneDay = 60 * 60 * 24 * 1000;
    const thirtyDays = 60 * 60 * 24 * 1000 * 30;
    res.cookie('accessToken', accessTokenJWT,
        {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            signed: true,
            expires: new Date(Date.now() + oneDay),
        });
    res.cookie('refreshToken', refreshTokenJWT,
        {
            expires: new Date(Date.now() + thirtyDays),
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
