const crypto = require('crypto');

const generateToken = (size = 40) => {
    return crypto.randomBytes(size).toString('hex');
}
module.exports = {
    generateToken
}
